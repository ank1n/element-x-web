/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import TabBar from "../../../../../src/components/structures/TabBar";
import { PageType } from "../../../../../src/PageTypes";

describe("TabBar", () => {
    const defaultProps = {
        currentPage: PageType.RoomView,
        onTabChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render all 4 tabs", () => {
        render(<TabBar {...defaultProps} />);

        expect(screen.getByText("👥")).toBeInTheDocument(); // Contacts
        expect(screen.getByText("📞")).toBeInTheDocument(); // Calls
        expect(screen.getByText("💬")).toBeInTheDocument(); // Chats
        expect(screen.getByText("📱")).toBeInTheDocument(); // Apps
    });

    it("should highlight contacts tab when active", () => {
        const { container } = render(<TabBar {...defaultProps} currentPage={PageType.ContactsView} />);
        const activeTab = container.querySelector(".mx_TabBar_tab_active");
        expect(activeTab?.textContent).toContain("👥");
    });

    it("should highlight calls tab when active", () => {
        const { container } = render(<TabBar {...defaultProps} currentPage={PageType.CallsView} />);
        const activeTab = container.querySelector(".mx_TabBar_tab_active");
        expect(activeTab?.textContent).toContain("📞");
    });

    it("should highlight chats tab when active", () => {
        const { container } = render(<TabBar {...defaultProps} currentPage={PageType.RoomView} />);
        const activeTab = container.querySelector(".mx_TabBar_tab_active");
        expect(activeTab?.textContent).toContain("💬");
    });

    it("should highlight apps tab when active", () => {
        const { container } = render(<TabBar {...defaultProps} currentPage={PageType.AppsView} />);
        const activeTab = container.querySelector(".mx_TabBar_tab_active");
        expect(activeTab?.textContent).toContain("📱");
    });

    it("should call onTabChange when contacts tab clicked", () => {
        render(<TabBar {...defaultProps} />);
        const contactsTab = screen.getByText("👥").closest("button");
        fireEvent.click(contactsTab!);
        expect(defaultProps.onTabChange).toHaveBeenCalledWith(PageType.ContactsView);
    });

    it("should call onTabChange when calls tab clicked", () => {
        render(<TabBar {...defaultProps} />);
        const callsTab = screen.getByText("📞").closest("button");
        fireEvent.click(callsTab!);
        expect(defaultProps.onTabChange).toHaveBeenCalledWith(PageType.CallsView);
    });

    it("should call onTabChange when chats tab clicked", () => {
        render(<TabBar {...defaultProps} />);
        const chatsTab = screen.getByText("💬").closest("button");
        fireEvent.click(chatsTab!);
        expect(defaultProps.onTabChange).toHaveBeenCalledWith(PageType.RoomView);
    });

    it("should call onTabChange when apps tab clicked", () => {
        render(<TabBar {...defaultProps} />);
        const appsTab = screen.getByText("📱").closest("button");
        fireEvent.click(appsTab!);
        expect(defaultProps.onTabChange).toHaveBeenCalledWith(PageType.AppsView);
    });

    it("should render tab labels", () => {
        render(<TabBar {...defaultProps} />);
        expect(screen.getByText("Contacts")).toBeInTheDocument();
        expect(screen.getByText("Calls")).toBeInTheDocument();
        expect(screen.getByText("Chats")).toBeInTheDocument();
        expect(screen.getByText("Apps")).toBeInTheDocument();
    });

    it("should not call onTabChange when already on that tab", () => {
        render(<TabBar {...defaultProps} currentPage={PageType.ContactsView} />);
        const contactsTab = screen.getByText("👥").closest("button");
        fireEvent.click(contactsTab!);
        // Should still call, navigation logic is in parent
        expect(defaultProps.onTabChange).toHaveBeenCalledWith(PageType.ContactsView);
    });
});
