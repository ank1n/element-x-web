/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { EventEmitter } from "events";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";

import { type RecordingState } from "../models/RecordingState";
import { getAppConfig } from "../config/appConfig";

export const RECORDING_STATE_CHANGED = "recording_state_changed";

interface RecordingInfo {
    egressId: string;
    roomName: string;
    status: number;
    startedAt?: string;
    endedAt?: string;
    downloadUrl?: string;
}

/**
 * Service for managing call recordings via LiveKit Egress API
 */
export class RecordingService extends EventEmitter {
    private static instance: RecordingService;
    private client: MatrixClient | null = null;
    private config = getAppConfig();
    private activeRecordings: Map<string, RecordingState> = new Map();

    public static sharedInstance(): RecordingService {
        if (!RecordingService.instance) {
            RecordingService.instance = new RecordingService();
        }
        return RecordingService.instance;
    }

    /**
     * Initialize service with Matrix client
     */
    public start(client: MatrixClient): void {
        this.client = client;
    }

    /**
     * Stop the service
     */
    public stop(): void {
        this.client = null;
        this.activeRecordings.clear();
    }

    /**
     * Start recording for a room
     */
    public async startRecording(roomId: string): Promise<RecordingState> {
        if (!this.config.enableCallRecording) {
            throw new Error("Call recording is disabled in configuration");
        }

        try {
            const response = await fetch(`${this.config.recordingApiBaseURL}/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomName: roomId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to start recording: ${response.statusText}`);
            }

            const data = await response.json();

            const recordingState: RecordingState = {
                egressId: data.egressId,
                roomId,
                status: "recording",
                startedAt: new Date(),
                downloadUrl: undefined,
                error: undefined,
            };

            this.activeRecordings.set(roomId, recordingState);
            this.emit(RECORDING_STATE_CHANGED, recordingState);

            return recordingState;
        } catch (error) {
            const recordingState: RecordingState = {
                egressId: "",
                roomId,
                status: "failed",
                startedAt: new Date(),
                downloadUrl: undefined,
                error: error instanceof Error ? error.message : "Unknown error",
            };

            this.emit(RECORDING_STATE_CHANGED, recordingState);
            throw error;
        }
    }

    /**
     * Stop recording for a room
     */
    public async stopRecording(roomId: string): Promise<RecordingState> {
        const recording = this.activeRecordings.get(roomId);
        if (!recording) {
            throw new Error("No active recording for this room");
        }

        try {
            const response = await fetch(`${this.config.recordingApiBaseURL}/stop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    egressId: recording.egressId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to stop recording: ${response.statusText}`);
            }

            const updatedState: RecordingState = {
                ...recording,
                status: "processing",
                endedAt: new Date(),
            };

            this.activeRecordings.set(roomId, updatedState);
            this.emit(RECORDING_STATE_CHANGED, updatedState);

            // Poll for completion
            this.pollRecordingStatus(roomId, recording.egressId);

            return updatedState;
        } catch (error) {
            const errorState: RecordingState = {
                ...recording,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            };

            this.activeRecordings.set(roomId, errorState);
            this.emit(RECORDING_STATE_CHANGED, errorState);
            throw error;
        }
    }

    /**
     * Get recording state for a room
     */
    public getRecordingState(roomId: string): RecordingState | null {
        return this.activeRecordings.get(roomId) || null;
    }

    /**
     * Get all recordings for a room
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
     * Delete a recording
     */
    public async deleteRecording(egressId: string): Promise<void> {
        try {
            const response = await fetch(`${this.config.recordingApiBaseURL}/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    egressId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete recording: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Failed to delete recording:", error);
            throw error;
        }
    }

    /**
     * Poll recording status until completion
     */
    private async pollRecordingStatus(roomId: string, egressId: string): Promise<void> {
        const maxAttempts = 30; // 30 seconds max
        let attempts = 0;

        const poll = async (): Promise<void> => {
            if (attempts >= maxAttempts) {
                const recording = this.activeRecordings.get(roomId);
                if (recording) {
                    const timeoutState: RecordingState = {
                        ...recording,
                        status: "failed",
                        error: "Recording processing timeout",
                    };
                    this.activeRecordings.set(roomId, timeoutState);
                    this.emit(RECORDING_STATE_CHANGED, timeoutState);
                }
                return;
            }

            try {
                const response = await fetch(`${this.config.recordingApiBaseURL}/status?egressId=${egressId}`);
                if (!response.ok) {
                    throw new Error(`Failed to get status: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.status === 1) {
                    // Recording ready
                    const recording = this.activeRecordings.get(roomId);
                    if (recording) {
                        const readyState: RecordingState = {
                            ...recording,
                            status: "ready",
                            downloadUrl: data.downloadUrl,
                        };
                        this.activeRecordings.set(roomId, readyState);
                        this.emit(RECORDING_STATE_CHANGED, readyState);
                    }
                } else if (data.status === 2) {
                    // Recording failed
                    const recording = this.activeRecordings.get(roomId);
                    if (recording) {
                        const failedState: RecordingState = {
                            ...recording,
                            status: "failed",
                            error: data.error || "Recording failed",
                        };
                        this.activeRecordings.set(roomId, failedState);
                        this.emit(RECORDING_STATE_CHANGED, failedState);
                    }
                } else {
                    // Still processing, poll again
                    attempts++;
                    setTimeout(poll, 1000);
                }
            } catch (error) {
                console.error("Failed to poll recording status:", error);
                const recording = this.activeRecordings.get(roomId);
                if (recording) {
                    const errorState: RecordingState = {
                        ...recording,
                        status: "failed",
                        error: error instanceof Error ? error.message : "Unknown error",
                    };
                    this.activeRecordings.set(roomId, errorState);
                    this.emit(RECORDING_STATE_CHANGED, errorState);
                }
            }
        };

        poll();
    }
}
