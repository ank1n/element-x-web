/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";

import { _t } from "../../languageHandler";
import { EmptyState } from "../common/EmptyState";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import { LoadingSkeleton } from "../common/LoadingSkeleton";
import { type CallHistoryItem, CallType } from "../../models/CallHistoryItem";
import { CallHistoryService, CALL_HISTORY_UPDATE_EVENT } from "../../services/CallHistoryService";
import CallHistoryCard from "../views/calls/CallHistoryCard";
import { MatrixClientPeg } from "../../MatrixClientPeg";

type FilterType = "all" | "missed" | "incoming" | "outgoing";

interface IState {
    calls: CallHistoryItem[];
    filteredCalls: CallHistoryItem[];
    isLoading: boolean;
    searchQuery: string;
    filter: FilterType;
    currentRecording: string | null;
}

/**
 * Calls view - shows call history with recordings
 */
export default class CallsView extends React.Component<{}, IState> {
    private client: MatrixClient | null = null;
    private callHistoryService: CallHistoryService;
    private audioRef: React.RefObject<HTMLAudioElement>;

    public constructor(props: {}) {
        super(props);

        this.state = {
            calls: [],
            filteredCalls: [],
            isLoading: true,
            searchQuery: "",
            filter: "all",
            currentRecording: null,
        };

        this.callHistoryService = CallHistoryService.sharedInstance();
        this.audioRef = React.createRef();
    }

    public async componentDidMount(): Promise<void> {
        this.client = MatrixClientPeg.safeGet();
        this.callHistoryService.start(this.client);
        this.callHistoryService.on(CALL_HISTORY_UPDATE_EVENT, this.onCallHistoryUpdate);

        await this.loadCallHistory();
    }

    public componentWillUnmount(): void {
        this.callHistoryService.removeListener(CALL_HISTORY_UPDATE_EVENT, this.onCallHistoryUpdate);
        if (this.audioRef.current) {
            this.audioRef.current.pause();
        }
    }

    private async loadCallHistory(): Promise<void> {
        this.setState({ isLoading: true });

        try {
            const calls = await this.callHistoryService.getCallHistory();
            this.setState({ calls, isLoading: false }, () => {
                this.applyFilters();
            });
        } catch (error) {
            console.error("Failed to load call history:", error);
            this.setState({ isLoading: false });
        }
    }

    private onCallHistoryUpdate = (): void => {
        this.loadCallHistory();
    };

    private onSearchChange = (query: string): void => {
        this.setState({ searchQuery: query }, () => {
            this.applyFilters();
        });
    };

    private onFilterChange = (filter: FilterType): void => {
        this.setState({ filter }, () => {
            this.applyFilters();
        });
    };

    private applyFilters(): void {
        let filtered = [...this.state.calls];

        // Apply search filter
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter((call) => call.contactName.toLowerCase().includes(query));
        }

        // Apply call type filter
        switch (this.state.filter) {
            case "missed":
                filtered = filtered.filter((call) => call.isMissed);
                break;
            case "incoming":
                filtered = filtered.filter((call) => call.callType === CallType.INCOMING && !call.isMissed);
                break;
            case "outgoing":
                filtered = filtered.filter((call) => call.callType === CallType.OUTGOING);
                break;
            case "all":
            default:
                break;
        }

        this.setState({ filteredCalls: filtered });
    }

    private onPlayRecording = (url: string): void => {
        if (this.audioRef.current) {
            if (this.state.currentRecording === url) {
                // Toggle playback
                if (this.audioRef.current.paused) {
                    this.audioRef.current.play();
                } else {
                    this.audioRef.current.pause();
                }
            } else {
                // Load and play new recording
                this.setState({ currentRecording: url }, () => {
                    if (this.audioRef.current) {
                        this.audioRef.current.src = url;
                        this.audioRef.current.play();
                    }
                });
            }
        }
    };

    private renderFilters(): React.ReactNode {
        const { filter } = this.state;

        return (
            <div className="mx_CallsView_filters">
                <FilterChip
                    title={_t("calls|filter_all")}
                    isSelected={filter === "all"}
                    onClick={() => this.onFilterChange("all")}
                />
                <FilterChip
                    title={_t("calls|filter_missed")}
                    isSelected={filter === "missed"}
                    onClick={() => this.onFilterChange("missed")}
                />
                <FilterChip
                    title={_t("calls|filter_incoming")}
                    isSelected={filter === "incoming"}
                    onClick={() => this.onFilterChange("incoming")}
                />
                <FilterChip
                    title={_t("calls|filter_outgoing")}
                    isSelected={filter === "outgoing"}
                    onClick={() => this.onFilterChange("outgoing")}
                />
            </div>
        );
    }

    private renderCalls(): React.ReactNode {
        const { filteredCalls, isLoading } = this.state;

        if (isLoading) {
            return <LoadingSkeleton count={5} />;
        }

        if (filteredCalls.length === 0) {
            return (
                <EmptyState
                    icon="📞"
                    title={_t("calls|empty_title")}
                    description={_t("calls|empty_description")}
                />
            );
        }

        return (
            <div className="mx_CallsView_list">
                {filteredCalls.map((call) => (
                    <CallHistoryCard key={call.id} call={call} onPlayRecording={this.onPlayRecording} />
                ))}
            </div>
        );
    }

    public render(): React.ReactNode {
        return (
            <div className="mx_CallsView">
                <div className="mx_CallsView_header">
                    <h1>{_t("calls|title")}</h1>
                </div>
                <div className="mx_CallsView_search">
                    <SearchBar
                        placeholder={_t("calls|search")}
                        value={this.state.searchQuery}
                        onChange={this.onSearchChange}
                    />
                </div>
                {this.renderFilters()}
                <div className="mx_CallsView_content">{this.renderCalls()}</div>
                <audio ref={this.audioRef} style={{ display: "none" }} controls />
            </div>
        );
    }
}
