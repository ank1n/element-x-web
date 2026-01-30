/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import AccessibleButton from "../views/elements/AccessibleButton";

interface FilterChipProps {
    title: string;
    isSelected: boolean;
    onClick: () => void;
}

/**
 * Reusable filter chip component for tab filtering
 */
export const FilterChip: React.FC<FilterChipProps> = ({ title, isSelected, onClick }) => {
    const classes = classNames("mx_FilterChip", {
        "mx_FilterChip_selected": isSelected,
    });

    return (
        <AccessibleButton className={classes} onClick={onClick}>
            {title}
        </AccessibleButton>
    );
};
