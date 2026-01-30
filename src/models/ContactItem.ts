/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

/**
 * Represents a contact in the contacts list
 */
export interface ContactItem {
    /** Matrix User ID (@user:server.com) */
    id: string;
    /** Display name of the contact */
    displayName: string;
    /** Avatar URL (mxc://) */
    avatarURL?: string;
    /** Online presence status */
    isOnline: boolean;
    /** Direct room ID for this contact */
    roomId?: string;
}
