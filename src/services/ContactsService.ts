/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { EventEmitter } from "events";
import { type MatrixClient, type Room, type User, type MatrixEvent } from "matrix-js-sdk/src/matrix";
import { PresenceState } from "matrix-js-sdk/src/types";

import { type ContactItem } from "../models/ContactItem";
import DMRoomMap from "../utils/DMRoomMap";

export const CONTACTS_UPDATE_EVENT = "contacts_update";

/**
 * Service for managing contacts list
 */
export class ContactsService extends EventEmitter {
    private static instance: ContactsService;
    private client: MatrixClient | null = null;

    public static sharedInstance(): ContactsService {
        if (!ContactsService.instance) {
            ContactsService.instance = new ContactsService();
        }
        return ContactsService.instance;
    }

    /**
     * Initialize service with Matrix client
     */
    public start(client: MatrixClient): void {
        this.client = client;
        this.client.on("User.presence" as any, this.onPresenceChange);
    }

    /**
     * Stop the service
     */
    public stop(): void {
        if (this.client) {
            this.client.removeListener("User.presence" as any, this.onPresenceChange);
            this.client = null;
        }
    }

    /**
     * Get list of contacts from direct message rooms
     */
    public async getContacts(): Promise<ContactItem[]> {
        if (!this.client) return [];

        const dmRoomMap = DMRoomMap.shared();
        const rooms = this.client.getRooms();
        const contacts: ContactItem[] = [];

        for (const room of rooms) {
            // Check if this is a DM room
            const dmUserId = dmRoomMap.getUserIdForRoomId(room.roomId);
            if (!dmUserId) continue;

            // Skip if DM with ourselves
            if (dmUserId === this.client.getUserId()) continue;

            const user = this.client.getUser(dmUserId);
            if (!user) continue;

            contacts.push({
                id: dmUserId,
                displayName: user.displayName || dmUserId,
                avatarURL: user.avatarUrl,
                isOnline: this.isUserOnline(user),
                roomId: room.roomId,
            });
        }

        // Sort by display name
        contacts.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return contacts;
    }

    /**
     * Get presence status for a user
     */
    public getPresence(userId: string): boolean {
        if (!this.client) return false;

        const user = this.client.getUser(userId);
        return user ? this.isUserOnline(user) : false;
    }

    /**
     * Subscribe to presence changes
     */
    public subscribeToPresence(callback: (userId: string, isOnline: boolean) => void): () => void {
        const handler = (event: MatrixEvent, user: User): void => {
            callback(user.userId, this.isUserOnline(user));
        };

        this.on(CONTACTS_UPDATE_EVENT, handler);

        return () => {
            this.removeListener(CONTACTS_UPDATE_EVENT, handler);
        };
    }

    /**
     * Check if user is online
     */
    private isUserOnline(user: User): boolean {
        const presence = user.presence;
        return presence === PresenceState.Online || presence === "online";
    }

    /**
     * Handle presence change events
     */
    private onPresenceChange = (event: MatrixEvent, user: User): void => {
        this.emit(CONTACTS_UPDATE_EVENT, event, user);
    };
}
