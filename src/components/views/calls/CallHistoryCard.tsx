/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import { type CallHistoryItem, CallType } from "../../../models/CallHistoryItem";
import BaseAvatar from "../avatars/BaseAvatar";
import { _t } from "../../../languageHandler";
import AccessibleButton from "../elements/AccessibleButton";

interface CallHistoryCardProps {
    call: CallHistoryItem;
    onPlayRecording?: (url: string) => void;
}

/**
 * Call history card showing call info and recording playback
 */
export default class CallHistoryCard extends React.PureComponent<CallHistoryCardProps> {
    private getCallTypeIcon(): string {
        const { call } = this.props;

        if (call.callType === CallType.VIDEO) {
            return "📹";
        } else if (call.callType === CallType.INCOMING) {
            return "↙";
        } else {
            return "↗";
        }
    }

    private getCallTypeLabel(): string {
        const { call } = this.props;

        if (call.isMissed) {
            return _t("calls|type_missed");
        }

        switch (call.callType) {
            case CallType.VIDEO:
                return _t("calls|type_video");
            case CallType.INCOMING:
                return _t("calls|type_incoming");
            case CallType.OUTGOING:
                return _t("calls|type_outgoing");
            default:
                return "";
        }
    }

    private formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    private formatTimestamp(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays === 1) {
            return "yesterday";
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    private onPlayClick = (): void => {
        if (this.props.call.recordingURL && this.props.onPlayRecording) {
            this.props.onPlayRecording(this.props.call.recordingURL);
        }
    };

    public render(): React.ReactNode {
        const { call } = this.props;

        const cardClass = classNames("mx_CallHistoryCard", {
            "mx_CallHistoryCard_missed": call.isMissed,
        });

        return (
            <div className={cardClass}>
                <div className="mx_CallHistoryCard_avatar">
                    <BaseAvatar name={call.contactName} idName={call.contactId} width={40} height={40} />
                </div>
                <div className="mx_CallHistoryCard_info">
                    <div className="mx_CallHistoryCard_name">{call.contactName}</div>
                    <div className="mx_CallHistoryCard_details">
                        <span className="mx_CallHistoryCard_type_icon">{this.getCallTypeIcon()}</span>
                        <span className="mx_CallHistoryCard_type_label">{this.getCallTypeLabel()}</span>
                        {call.duration !== undefined && (
                            <>
                                <span className="mx_CallHistoryCard_separator">•</span>
                                <span className="mx_CallHistoryCard_duration">
                                    {this.formatDuration(call.duration)}
                                </span>
                            </>
                        )}
                        {call.recordingURL && (
                            <span className="mx_CallHistoryCard_recording_indicator">~~~</span>
                        )}
                    </div>
                </div>
                <div className="mx_CallHistoryCard_meta">
                    <div className="mx_CallHistoryCard_timestamp">{this.formatTimestamp(call.timestamp)}</div>
                    {call.recordingURL && (
                        <AccessibleButton
                            className="mx_CallHistoryCard_playButton"
                            onClick={this.onPlayClick}
                            title="Play recording"
                        >
                            ▶
                        </AccessibleButton>
                    )}
                </div>
            </div>
        );
    }
}
