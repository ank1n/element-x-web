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
import { type ContactItem } from "../../models/ContactItem";
import { ContactsService, CONTACTS_UPDATE_EVENT } from "../../services/ContactsService";
import ContactCard from "../views/contacts/ContactCard";
import { MatrixClientPeg } from "../../MatrixClientPeg";
import dis from "../../dispatcher/dispatcher";
import { Action } from "../../dispatcher/actions";

type FilterType = "all" | "online" | "favorites";

interface IState {
    contacts: ContactItem[];
    filteredContacts: ContactItem[];
    isLoading: boolean;
    searchQuery: string;
    filter: FilterType;
}

/**
 * Contacts view - shows list of contacts from direct message rooms
 */
export default class ContactsView extends React.Component<{}, IState> {
    private client: MatrixClient | null = null;
    private contactsService: ContactsService;

    public constructor(props: {}) {
        super(props);

        this.state = {
            contacts: [],
            filteredContacts: [],
            isLoading: true,
            searchQuery: "",
            filter: "all",
        };

        this.contactsService = ContactsService.sharedInstance();
    }

    public async componentDidMount(): Promise<void> {
        this.client = MatrixClientPeg.safeGet();
        this.contactsService.start(this.client);
        this.contactsService.on(CONTACTS_UPDATE_EVENT, this.onContactsUpdate);

        await this.loadContacts();
    }

    public componentWillUnmount(): void {
        this.contactsService.removeListener(CONTACTS_UPDATE_EVENT, this.onContactsUpdate);
    }

    private async loadContacts(): Promise<void> {
        this.setState({ isLoading: true });

        try {
            const contacts = await this.contactsService.getContacts();
            this.setState({ contacts, isLoading: false }, () => {
                this.applyFilters();
            });
        } catch (error) {
            console.error("Failed to load contacts:", error);
            this.setState({ isLoading: false });
        }
    }

    private onContactsUpdate = (): void => {
        this.loadContacts();
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
        let filtered = [...this.state.contacts];

        // Apply search filter
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter((contact) => contact.displayName.toLowerCase().includes(query));
        }

        // Apply status filter
        switch (this.state.filter) {
            case "online":
                filtered = filtered.filter((contact) => contact.isOnline);
                break;
            case "favorites":
                // TODO: Implement favorites
                break;
            case "all":
            default:
                break;
        }

        this.setState({ filteredContacts: filtered });
    }

    private onContactClick = (contact: ContactItem): void => {
        if (contact.roomId) {
            dis.dispatch({
                action: Action.ViewRoom,
                room_id: contact.roomId,
            });
        }
    };

    private renderFilters(): React.ReactNode {
        const { filter } = this.state;

        return (
            <div className="mx_ContactsView_filters">
                <FilterChip
                    title={_t("contacts|filter_all")}
                    isSelected={filter === "all"}
                    onClick={() => this.onFilterChange("all")}
                />
                <FilterChip
                    title={_t("contacts|filter_online")}
                    isSelected={filter === "online"}
                    onClick={() => this.onFilterChange("online")}
                />
                <FilterChip
                    title={_t("contacts|filter_favorites")}
                    isSelected={filter === "favorites"}
                    onClick={() => this.onFilterChange("favorites")}
                />
            </div>
        );
    }

    private renderContacts(): React.ReactNode {
        const { filteredContacts, isLoading } = this.state;

        if (isLoading) {
            return <LoadingSkeleton count={5} />;
        }

        if (filteredContacts.length === 0) {
            return (
                <EmptyState
                    icon="👥"
                    title={_t("contacts|empty_title")}
                    description={_t("contacts|empty_description")}
                />
            );
        }

        return (
            <div className="mx_ContactsView_list">
                {filteredContacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} onClick={this.onContactClick} />
                ))}
            </div>
        );
    }

    public render(): React.ReactNode {
        return (
            <div className="mx_ContactsView">
                <div className="mx_ContactsView_header">
                    <h1>{_t("contacts|title")}</h1>
                </div>
                <div className="mx_ContactsView_search">
                    <SearchBar
                        placeholder={_t("contacts|search")}
                        value={this.state.searchQuery}
                        onChange={this.onSearchChange}
                    />
                </div>
                {this.renderFilters()}
                <div className="mx_ContactsView_content">{this.renderContacts()}</div>
            </div>
        );
    }
}
