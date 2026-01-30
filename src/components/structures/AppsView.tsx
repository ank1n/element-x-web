/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import { _t } from "../../languageHandler";
import { EmptyState } from "../common/EmptyState";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import { type AppItem } from "../../models/AppItem";
import { getAppConfig } from "../../config/appConfig";
import AppCard from "../views/apps/AppCard";
import AppDetailView from "../views/apps/AppDetailView";

type FilterType = "all" | "pinned";

interface IState {
    apps: AppItem[];
    filteredApps: AppItem[];
    searchQuery: string;
    filter: FilterType;
    selectedApp: AppItem | null;
}

/**
 * Apps view - shows embedded applications from config
 */
export default class AppsView extends React.Component<{}, IState> {
    public constructor(props: {}) {
        super(props);

        const config = getAppConfig();

        this.state = {
            apps: config.apps,
            filteredApps: config.apps,
            searchQuery: "",
            filter: "all",
            selectedApp: null,
        };
    }

    public componentDidMount(): void {
        this.applyFilters();
    }

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
        let filtered = [...this.state.apps];

        // Apply search filter
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(
                (app) => app.name.toLowerCase().includes(query) || app.description.toLowerCase().includes(query),
            );
        }

        // Apply pinned filter
        if (this.state.filter === "pinned") {
            filtered = filtered.filter((app) => app.isPinned);
        }

        this.setState({ filteredApps: filtered });
    }

    private onAppClick = (app: AppItem): void => {
        this.setState({ selectedApp: app });
    };

    private onAppClose = (): void => {
        this.setState({ selectedApp: null });
    };

    private renderFilters(): React.ReactNode {
        const { filter } = this.state;

        return (
            <div className="mx_AppsView_filters">
                <FilterChip
                    title={_t("apps|filter_all")}
                    isSelected={filter === "all"}
                    onClick={() => this.onFilterChange("all")}
                />
                <FilterChip
                    title={_t("apps|filter_pinned")}
                    isSelected={filter === "pinned"}
                    onClick={() => this.onFilterChange("pinned")}
                />
            </div>
        );
    }

    private renderApps(): React.ReactNode {
        const { filteredApps } = this.state;

        if (filteredApps.length === 0) {
            return (
                <EmptyState
                    icon="📱"
                    title={_t("apps|empty_title")}
                    description={_t("apps|empty_description")}
                />
            );
        }

        return (
            <div className="mx_AppsView_list">
                {filteredApps.map((app) => (
                    <AppCard key={app.id} app={app} onClick={this.onAppClick} />
                ))}
            </div>
        );
    }

    public render(): React.ReactNode {
        const { selectedApp } = this.state;

        if (selectedApp) {
            return <AppDetailView app={selectedApp} onClose={this.onAppClose} />;
        }

        return (
            <div className="mx_AppsView">
                <div className="mx_AppsView_header">
                    <h1>{_t("apps|title")}</h1>
                </div>
                <div className="mx_AppsView_search">
                    <SearchBar
                        placeholder={_t("apps|search")}
                        value={this.state.searchQuery}
                        onChange={this.onSearchChange}
                    />
                </div>
                {this.renderFilters()}
                <div className="mx_AppsView_content">{this.renderApps()}</div>
            </div>
        );
    }
}
