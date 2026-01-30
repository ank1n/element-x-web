/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

/**
 * State of call recording
 */
export type RecordingState =
    | { type: "idle" }
    | { type: "starting" }
    | { type: "recording"; egressId: string }
    | { type: "stopping" }
    | { type: "error"; message: string };

/**
 * Information about a recording egress
 */
export interface EgressInfo {
    egressId: string;
    roomName: string;
    status: number;
    startedAt?: string;
    endedAt?: string;
    filepath?: string;
    downloadUrl?: string;
}

/**
 * Recording API response for starting recording
 */
export interface StartRecordingResponse {
    success: boolean;
    egressId: string;
    status: number;
    roomName: string;
    filepath: string;
}

/**
 * Recording API response for stopping recording
 */
export interface StopRecordingResponse {
    success: boolean;
    egressId: string;
    status: number;
}
