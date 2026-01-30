/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

interface LoadingSkeletonProps {
    count?: number;
}

/**
 * Loading skeleton component with shimmer animation
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 5 }) => {
    return (
        <div className="mx_LoadingSkeleton">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="mx_LoadingSkeleton_item">
                    <div className="mx_LoadingSkeleton_avatar" />
                    <div className="mx_LoadingSkeleton_content">
                        <div className="mx_LoadingSkeleton_line mx_LoadingSkeleton_line--primary" />
                        <div className="mx_LoadingSkeleton_line mx_LoadingSkeleton_line--secondary" />
                    </div>
                </div>
            ))}
        </div>
    );
};
