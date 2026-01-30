/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
}

/**
 * Empty state component shown when lists are empty
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => {
    return (
        <div className="mx_EmptyState">
            <div className="mx_EmptyState_icon">{icon}</div>
            <h3 className="mx_EmptyState_title">{title}</h3>
            <p className="mx_EmptyState_description">{description}</p>
        </div>
    );
};
