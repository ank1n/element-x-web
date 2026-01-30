/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import classNames from "classnames";

import { type RecordingState } from "../../../models/RecordingState";
import { RecordingService, RECORDING_STATE_CHANGED } from "../../../services/RecordingService";
import AccessibleButton from "../elements/AccessibleButton";
import { _t } from "../../../languageHandler";

interface RecordingControlsProps {
    roomId: string;
}

interface IState {
    recordingState: RecordingState | null;
}

/**
 * Recording controls for call view
 */
export default class RecordingControls extends React.Component<RecordingControlsProps, IState> {
    private recordingService: RecordingService;

    public constructor(props: RecordingControlsProps) {
        super(props);

        this.state = {
            recordingState: null,
        };

        this.recordingService = RecordingService.sharedInstance();
    }

    public componentDidMount(): void {
        this.recordingService.on(RECORDING_STATE_CHANGED, this.onRecordingStateChanged);
        this.updateRecordingState();
    }

    public componentWillUnmount(): void {
        this.recordingService.removeListener(RECORDING_STATE_CHANGED, this.onRecordingStateChanged);
    }

    private updateRecordingState(): void {
        const state = this.recordingService.getRecordingState(this.props.roomId);
        this.setState({ recordingState: state });
    }

    private onRecordingStateChanged = (state: RecordingState): void => {
        if (state.roomId === this.props.roomId) {
            this.setState({ recordingState: state });
        }
    };

    private onStartClick = async (): Promise<void> => {
        try {
            await this.recordingService.startRecording(this.props.roomId);
        } catch (error) {
            console.error("Failed to start recording:", error);
        }
    };

    private onStopClick = async (): Promise<void> => {
        try {
            await this.recordingService.stopRecording(this.props.roomId);
        } catch (error) {
            console.error("Failed to stop recording:", error);
        }
    };

    private getStatusText(): string {
        const { recordingState } = this.state;
        if (!recordingState) return "";

        switch (recordingState.status) {
            case "recording":
                return _t("recording|status_recording");
            case "processing":
                return _t("recording|status_processing");
            case "ready":
                return _t("recording|status_ready");
            case "failed":
                return _t("recording|status_failed");
            default:
                return "";
        }
    }

    private getRecordingDuration(): string {
        const { recordingState } = this.state;
        if (!recordingState || !recordingState.startedAt) return "0:00";

        const endTime = recordingState.endedAt || new Date();
        const durationMs = endTime.getTime() - recordingState.startedAt.getTime();
        const seconds = Math.floor(durationMs / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    public render(): React.ReactNode {
        const { recordingState } = this.state;
        const isRecording = recordingState?.status === "recording";
        const canStart = !recordingState || recordingState.status === "ready" || recordingState.status === "failed";
        const canStop = recordingState?.status === "recording";

        const containerClass = classNames("mx_RecordingControls", {
            "mx_RecordingControls_active": isRecording,
        });

        return (
            <div className={containerClass}>
                {recordingState && (
                    <div className="mx_RecordingControls_status">
                        <span className="mx_RecordingControls_indicator" />
                        <span className="mx_RecordingControls_text">{this.getStatusText()}</span>
                        {isRecording && (
                            <span className="mx_RecordingControls_duration">{this.getRecordingDuration()}</span>
                        )}
                    </div>
                )}

                <div className="mx_RecordingControls_buttons">
                    {canStart && (
                        <AccessibleButton
                            className="mx_RecordingControls_startButton"
                            onClick={this.onStartClick}
                            title={_t("recording|title")}
                        >
                            ⏺
                        </AccessibleButton>
                    )}
                    {canStop && (
                        <AccessibleButton
                            className="mx_RecordingControls_stopButton"
                            onClick={this.onStopClick}
                            title="Stop recording"
                        >
                            ⏹
                        </AccessibleButton>
                    )}
                </div>
            </div>
        );
    }
}
