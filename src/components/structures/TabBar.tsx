/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import AccessibleButton from "../views/elements/AccessibleButton";
import { _t } from "../../languageHandler";
import PageTypes from "../../PageTypes";
import { getAppConfig } from "../../config/appConfig";

interface TabBarProps {
    currentPage: PageTypes;
    onTabChange: (page: PageTypes) => void;
}

/**
 * Bottom tab bar for 4-tab navigation
 */
export default class TabBar extends React.Component<TabBarProps> {
    private config = getAppConfig();

    private onContactsClick = (): void => {
        this.props.onTabChange(PageTypes.ContactsView);
    };

    private onCallsClick = (): void => {
        this.props.onTabChange(PageTypes.CallsView);
    };

    private onChatsClick = (): void => {
        this.props.onTabChange(PageTypes.RoomView);
    };

    private onAppsClick = (): void => {
        this.props.onTabChange(PageTypes.AppsView);
    };

    public render(): React.ReactNode {
        const { currentPage } = this.props;

        return (
            <div className="mx_TabBar">
                {this.config.enableContactsTab && (
                    <AccessibleButton
                        className={classNames("mx_TabBar_tab", {
                            "mx_TabBar_tab_active": currentPage === PageTypes.ContactsView,
                        })}
                        onClick={this.onContactsClick}
                        title={_t("tabs.contacts")}
                    >
                        <div className="mx_TabBar_icon">👥</div>
                        <div className="mx_TabBar_label">{_t("tabs.contacts")}</div>
                    </AccessibleButton>
                )}

                {this.config.enableCallsTab && (
                    <AccessibleButton
                        className={classNames("mx_TabBar_tab", {
                            "mx_TabBar_tab_active": currentPage === PageTypes.CallsView,
                        })}
                        onClick={this.onCallsClick}
                        title={_t("tabs.calls")}
                    >
                        <div className="mx_TabBar_icon">📞</div>
                        <div className="mx_TabBar_label">{_t("tabs.calls")}</div>
                    </AccessibleButton>
                )}

                <AccessibleButton
                    className={classNames("mx_TabBar_tab", {
                        "mx_TabBar_tab_active": currentPage === PageTypes.RoomView || currentPage === PageTypes.HomePage,
                    })}
                    onClick={this.onChatsClick}
                    title={_t("tabs.chats")}
                >
                    <div className="mx_TabBar_icon">💬</div>
                    <div className="mx_TabBar_label">{_t("tabs.chats")}</div>
                </AccessibleButton>

                {this.config.enableAppsTab && (
                    <AccessibleButton
                        className={classNames("mx_TabBar_tab", {
                            "mx_TabBar_tab_active": currentPage === PageTypes.AppsView,
                        })}
                        onClick={this.onAppsClick}
                        title={_t("tabs.apps")}
                    >
                        <div className="mx_TabBar_icon">📱</div>
                        <div className="mx_TabBar_label">{_t("tabs.apps")}</div>
                    </AccessibleButton>
                )}
            </div>
        );
    }
}
