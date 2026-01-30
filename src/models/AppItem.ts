/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

/**
 * Category of application
 */
export enum AppCategory {
    ALL = "all",
    PRODUCTIVITY = "productivity",
    COMMUNICATION = "communication",
    TOOLS = "tools",
    ANALYTICS = "analytics",
}

/**
 * Represents an embeddable application/widget
 */
export interface AppItem {
    /** Unique identifier for the app */
    id: string;
    /** Display name of the app */
    name: string;
    /** Brief description */
    description: string;
    /** Icon name or emoji */
    icon: string;
    /** URL of the application */
    url: string;
    /** Category for filtering */
    category: AppCategory;
}
