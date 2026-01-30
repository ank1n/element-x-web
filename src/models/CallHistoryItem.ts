/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

/**
 * Type of call
 */
export enum CallType {
    INCOMING = "incoming",
    OUTGOING = "outgoing",
    VIDEO = "video",
}

/**
 * Represents a call history entry
 */
export interface CallHistoryItem {
    /** Unique identifier for the call */
    id: string;
    /** Display name of the contact */
    contactName: string;
    /** Matrix User ID */
    contactId: string;
    /** Type of call */
    callType: CallType;
    /** Timestamp when call occurred */
    timestamp: Date;
    /** Call duration in seconds */
    duration?: number;
    /** Whether the call was missed */
    isMissed: boolean;
    /** URL to call recording (if available) */
    recordingURL?: string;
    /** Room ID where call took place */
    roomId?: string;
}
