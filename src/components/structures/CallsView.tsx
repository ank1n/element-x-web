/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import { _t } from "../../languageHandler";
import { EmptyState } from "../common/EmptyState";

/**
 * Calls view - shows call history
 * TODO: Implement in Phase 4
 */
export default class CallsView extends React.Component {
    public render(): React.ReactNode {
        return (
            <div className="mx_CallsView">
                <div className="mx_CallsView_header">
                    <h1>{_t("calls.title")}</h1>
                </div>
                <div className="mx_CallsView_content">
                    <EmptyState
                        icon="📞"
                        title={_t("calls.empty_title")}
                        description={_t("calls.empty_description")}
                    />
                </div>
            </div>
        );
    }
}
