/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { EventEmitter } from "events";
import { type MatrixClient, type MatrixEvent, type Room } from "matrix-js-sdk/src/matrix";
import { EventType } from "matrix-js-sdk/src/types";

import { type CallHistoryItem, CallType } from "../models/CallHistoryItem";
import { getAppConfig } from "../config/appConfig";

export const CALL_HISTORY_UPDATE_EVENT = "call_history_update";

interface RecordingInfo {
    egressId: string;
    roomName: string;
    status: number;
    startedAt?: string;
    endedAt?: string;
    downloadUrl?: string;
}

/**
 * Service for managing call history
 */
export class CallHistoryService extends EventEmitter {
    private static instance: CallHistoryService;
    private client: MatrixClient | null = null;
    private config = getAppConfig();

    public static sharedInstance(): CallHistoryService {
        if (!CallHistoryService.instance) {
            CallHistoryService.instance = new CallHistoryService();
        }
        return CallHistoryService.instance;
    }

    /**
     * Initialize service with Matrix client
     */
    public start(client: MatrixClient): void {
        this.client = client;
        // Listen for call events
        this.client.on("event" as any, this.onCallEvent);
    }

    /**
     * Stop the service
     */
    public stop(): void {
        if (this.client) {
            this.client.removeListener("event" as any, this.onCallEvent);
            this.client = null;
        }
    }

    /**
     * Get call history from Matrix events
     */
    public async getCallHistory(): Promise<CallHistoryItem[]> {
        if (!this.client) return [];

        const rooms = this.client.getRooms();
        const calls: CallHistoryItem[] = [];

        for (const room of rooms) {
            const timeline = room.getLiveTimeline();
            const events = timeline.getEvents();

            for (const event of events) {
                if (this.isCallEvent(event)) {
                    const callItem = await this.eventToCallHistoryItem(event, room);
                    if (callItem) {
                        calls.push(callItem);
                    }
                }
            }
        }

        // Sort by timestamp (most recent first)
        calls.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return calls;
    }

    /**
     * Get recordings for a room
     */
    public async getRecordingsForRoom(roomId: string): Promise<RecordingInfo[]> {
        if (!this.config.enableCallRecording) return [];

        try {
            const response = await fetch(`${this.config.recordingApiBaseURL}/list?roomName=${roomId}`);
            if (!response.ok) return [];

            const data = await response.json();
            return data.recordings || [];
        } catch (error) {
            console.error("Failed to fetch recordings:", error);
            return [];
        }
    }

    /**
     * Check if event is a call event
     */
    private isCallEvent(event: MatrixEvent): boolean {
        const type = event.getType();
        return (
            type === "m.call.invite" ||
            type === "m.call.answer" ||
            type === "m.call.hangup" ||
            type === EventType.CallInvite ||
            type === EventType.CallAnswer ||
            type === EventType.CallHangup
        );
    }

    /**
     * Convert Matrix event to CallHistoryItem
     */
    private async eventToCallHistoryItem(event: MatrixEvent, room: Room): Promise<CallHistoryItem | null> {
        const type = event.getType();
        const sender = event.getSender();
        const timestamp = new Date(event.getTs());

        if (!sender || !this.client) return null;

        const user = this.client.getUser(sender);
        const contactName = user?.displayName || sender;
        const isIncoming = sender !== this.client.getUserId();

        // Determine call type
        let callType: CallType;
        const content = event.getContent();

        if (content.type === "video" || type.includes("video")) {
            callType = CallType.VIDEO;
        } else if (isIncoming) {
            callType = CallType.INCOMING;
        } else {
            callType = CallType.OUTGOING;
        }

        // Check if call was answered (simplified - in real implementation, check for answer event)
        const isMissed = type.includes("invite") && isIncoming && !this.wasCallAnswered(event, room);

        // Try to get recording URL
        let recordingURL: string | undefined;
        const recordings = await this.getRecordingsForRoom(room.roomId);
        if (recordings.length > 0) {
            // Match recording by timestamp (simplified)
            const recording = recordings.find((r) => {
                if (!r.startedAt) return false;
                const recTime = new Date(r.startedAt).getTime();
                return Math.abs(recTime - timestamp.getTime()) < 60000; // Within 1 minute
            });
            recordingURL = recording?.downloadUrl;
        }

        return {
            id: event.getId() || `call-${Date.now()}`,
            contactName,
            contactId: sender,
            callType,
            timestamp,
            duration: this.getCallDuration(event, room),
            isMissed,
            recordingURL,
            roomId: room.roomId,
        };
    }

    /**
     * Check if call was answered (simplified)
     */
    private wasCallAnswered(inviteEvent: MatrixEvent, room: Room): boolean {
        const callId = inviteEvent.getContent().call_id;
        if (!callId) return false;

        const timeline = room.getLiveTimeline();
        const events = timeline.getEvents();

        // Look for answer event with same call_id
        return events.some((e) => {
            const type = e.getType();
            return (
                (type === "m.call.answer" || type === EventType.CallAnswer) && e.getContent().call_id === callId
            );
        });
    }

    /**
     * Get call duration (simplified)
     */
    private getCallDuration(event: MatrixEvent, room: Room): number | undefined {
        // In real implementation, calculate from invite to hangup
        // For now, return undefined or mock value
        return undefined;
    }

    /**
     * Handle call events
     */
    private onCallEvent = (event: MatrixEvent): void => {
        if (this.isCallEvent(event)) {
            this.emit(CALL_HISTORY_UPDATE_EVENT, event);
        }
    };
}
