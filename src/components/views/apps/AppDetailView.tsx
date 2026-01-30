/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import { type AppItem } from "../../../models/AppItem";
import AccessibleButton from "../elements/AccessibleButton";
import { _t } from "../../../languageHandler";

interface AppDetailViewProps {
    app: AppItem;
    onClose: () => void;
}

interface IState {
    isLoading: boolean;
}

/**
 * Full-screen app view with iframe integration
 */
export default class AppDetailView extends React.Component<AppDetailViewProps, IState> {
    private iframeRef: React.RefObject<HTMLIFrameElement>;

    public constructor(props: AppDetailViewProps) {
        super(props);

        this.state = {
            isLoading: true,
        };

        this.iframeRef = React.createRef();
    }

    private onIframeLoad = (): void => {
        this.setState({ isLoading: false });
    };

    private onCloseClick = (): void => {
        this.props.onClose();
    };

    public render(): React.ReactNode {
        const { app } = this.props;
        const { isLoading } = this.state;

        return (
            <div className="mx_AppDetailView">
                <div className="mx_AppDetailView_header">
                    <div className="mx_AppDetailView_title">
                        <span className="mx_AppDetailView_icon">{app.icon}</span>
                        <span className="mx_AppDetailView_name">{app.name}</span>
                    </div>
                    <AccessibleButton
                        className="mx_AppDetailView_closeButton"
                        onClick={this.onCloseClick}
                        title={_t("action|close")}
                    >
                        ✕
                    </AccessibleButton>
                </div>
                <div className="mx_AppDetailView_content">
                    {isLoading && (
                        <div className="mx_AppDetailView_loading">
                            <div className="mx_AppDetailView_spinner" />
                            <div className="mx_AppDetailView_loading_text">Loading {app.name}...</div>
                        </div>
                    )}
                    <iframe
                        ref={this.iframeRef}
                        src={app.url}
                        className="mx_AppDetailView_iframe"
                        title={app.name}
                        onLoad={this.onIframeLoad}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        allow="clipboard-read; clipboard-write"
                    />
                </div>
            </div>
        );
    }
}
