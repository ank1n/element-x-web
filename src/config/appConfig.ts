/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { AppItem, AppCategory } from "../models/AppItem";

/**
 * Application configuration
 */
export interface AppConfig {
    /** Base URL for Recording API */
    recordingApiBaseURL: string;
    /** Base URL for Apps API (optional) */
    appsApiBaseURL?: string;
    /** Enable Contacts tab */
    enableContactsTab: boolean;
    /** Enable Calls tab */
    enableCallsTab: boolean;
    /** Enable Apps tab */
    enableAppsTab: boolean;
    /** Enable call recording feature */
    enableCallRecording: boolean;
    /** Predefined list of apps (if not using API) */
    apps?: AppItem[];
}

/**
 * Default configuration
 */
export const defaultConfig: AppConfig = {
    recordingApiBaseURL: "https://api.market.implica.ru/api/recording",
    enableContactsTab: true,
    enableCallsTab: true,
    enableAppsTab: true,
    enableCallRecording: true,
    apps: [
        {
            id: "security",
            name: "Security Portal",
            description: "AI-driven container security monitoring",
            icon: "🛡️",
            url: "https://ozzy.implica.ru/security/",
            category: AppCategory.TOOLS,
        },
        {
            id: "labeling",
            name: "Flow Labeling",
            description: "Label network flows for ML training",
            icon: "🏷️",
            url: "https://ozzy.implica.ru/labeling/",
            category: AppCategory.TOOLS,
        },
        {
            id: "mlops",
            name: "MLOps Dashboard",
            description: "Model training and deployment",
            icon: "🤖",
            url: "https://ozzy.implica.ru/mlops/",
            category: AppCategory.ANALYTICS,
        },
    ],
};

/**
 * Get application configuration
 * Can be extended to load from server or localStorage
 */
export function getAppConfig(): AppConfig {
    // TODO: Load from .well-known/matrix/client or server config
    return defaultConfig;
}
