/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import { type AppItem } from "../../../models/AppItem";
import AccessibleButton from "../elements/AccessibleButton";

interface AppCardProps {
    app: AppItem;
    onClick?: (app: AppItem) => void;
}

/**
 * App card showing app icon, name, and description
 */
export default class AppCard extends React.PureComponent<AppCardProps> {
    private onClick = (): void => {
        if (this.props.onClick) {
            this.props.onClick(this.props.app);
        }
    };

    public render(): React.ReactNode {
        const { app } = this.props;

        const cardClass = classNames("mx_AppCard", {
            "mx_AppCard_pinned": app.isPinned,
        });

        return (
            <AccessibleButton className={cardClass} onClick={this.onClick}>
                <div className="mx_AppCard_icon">{app.icon}</div>
                <div className="mx_AppCard_info">
                    <div className="mx_AppCard_name">{app.name}</div>
                    <div className="mx_AppCard_description">{app.description}</div>
                </div>
                {app.isPinned && <div className="mx_AppCard_pin_indicator">📌</div>}
            </AccessibleButton>
        );
    }
}
