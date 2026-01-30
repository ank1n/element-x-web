/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import { _t } from "../../languageHandler";
import { EmptyState } from "../common/EmptyState";

/**
 * Contacts view - shows list of contacts
 * TODO: Implement in Phase 3
 */
export default class ContactsView extends React.Component {
    public render(): React.ReactNode {
        return (
            <div className="mx_ContactsView">
                <div className="mx_ContactsView_header">
                    <h1>{_t("contacts|title")}</h1>
                </div>
                <div className="mx_ContactsView_content">
                    <EmptyState
                        icon="👥"
                        title={_t("contacts|empty_title")}
                        description={_t("contacts|empty_description")}
                    />
                </div>
            </div>
        );
    }
}
