/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import AppCard from "../../../../../src/components/views/apps/AppCard";
import { type AppItem } from "../../../../../src/models/AppItem";

describe("AppCard", () => {
    const mockApp: AppItem = {
        id: "security",
        name: "Security Portal",
        description: "Monitor security incidents",
        url: "https://ozzy.implica.ru/security/",
        icon: "🔒",
        isPinned: false,
    };

    it("should render app name", () => {
        render(<AppCard app={mockApp} />);
        expect(screen.getByText("Security Portal")).toBeInTheDocument();
    });

    it("should render app description", () => {
        render(<AppCard app={mockApp} />);
        expect(screen.getByText("Monitor security incidents")).toBeInTheDocument();
    });

    it("should render app icon", () => {
        render(<AppCard app={mockApp} />);
        expect(screen.getByText("🔒")).toBeInTheDocument();
    });

    it("should call onClick when clicked", () => {
        const onClick = jest.fn();
        render(<AppCard app={mockApp} onClick={onClick} />);

        const card = screen.getByRole("button");
        fireEvent.click(card);

        expect(onClick).toHaveBeenCalledWith(mockApp);
    });

    it("should show pin indicator for pinned apps", () => {
        const pinnedApp = { ...mockApp, isPinned: true };
        render(<AppCard app={pinnedApp} />);
        expect(screen.getByText("📌")).toBeInTheDocument();
    });

    it("should not show pin indicator for non-pinned apps", () => {
        render(<AppCard app={mockApp} />);
        expect(screen.queryByText("📌")).not.toBeInTheDocument();
    });

    it("should apply pinned style for pinned apps", () => {
        const pinnedApp = { ...mockApp, isPinned: true };
        const { container } = render(<AppCard app={pinnedApp} />);
        const card = container.querySelector(".mx_AppCard_pinned");
        expect(card).toBeInTheDocument();
    });

    it("should not apply pinned style for non-pinned apps", () => {
        const { container } = render(<AppCard app={mockApp} />);
        const card = container.querySelector(".mx_AppCard_pinned");
        expect(card).not.toBeInTheDocument();
    });
});
