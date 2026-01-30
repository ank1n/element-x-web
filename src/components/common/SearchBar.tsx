/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

interface SearchBarProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

/**
 * Reusable search bar component
 */
export const SearchBar: React.FC<SearchBarProps> = ({ placeholder, value, onChange }) => {
    const handleChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(ev.target.value);
    };

    return (
        <div className="mx_SearchBar">
            <input
                type="text"
                className="mx_SearchBar_input"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                autoComplete="off"
            />
        </div>
    );
};
