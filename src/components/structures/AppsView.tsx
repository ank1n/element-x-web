/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import { _t } from "../../languageHandler";
import { EmptyState } from "../common/EmptyState";

/**
 * Apps view - shows embedded applications
 * TODO: Implement in Phase 5
 */
export default class AppsView extends React.Component {
    public render(): React.ReactNode {
        return (
            <div className="mx_AppsView">
                <div className="mx_AppsView_header">
                    <h1>{_t("apps|title")}</h1>
                </div>
                <div className="mx_AppsView_content">
                    <EmptyState
                        icon="📱"
                        title={_t("apps|empty_title")}
                        description={_t("apps|empty_description")}
                    />
                </div>
            </div>
        );
    }
}
