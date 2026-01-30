/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import ContactCard from "../../../../../src/components/views/contacts/ContactCard";
import { type ContactItem } from "../../../../../src/models/ContactItem";

describe("ContactCard", () => {
    const mockContact: ContactItem = {
        id: "@user:example.com",
        displayName: "Test User",
        avatarURL: "mxc://example.com/avatar",
        isOnline: true,
        roomId: "!room:example.com",
    };

    it("should render contact name", () => {
        render(<ContactCard contact={mockContact} />);
        expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("should show online status", () => {
        render(<ContactCard contact={mockContact} />);
        expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("should show offline status", () => {
        const offlineContact = { ...mockContact, isOnline: false };
        render(<ContactCard contact={offlineContact} />);
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("should call onClick when clicked", () => {
        const onClick = jest.fn();
        render(<ContactCard contact={mockContact} onClick={onClick} />);

        const card = screen.getByRole("button");
        fireEvent.click(card);

        expect(onClick).toHaveBeenCalledWith(mockContact);
    });

    it("should render with avatar", () => {
        const { container } = render(<ContactCard contact={mockContact} />);
        const avatar = container.querySelector(".mx_BaseAvatar");
        expect(avatar).toBeInTheDocument();
    });

    it("should handle contact without avatar URL", () => {
        const contactWithoutAvatar = { ...mockContact, avatarURL: undefined };
        const { container } = render(<ContactCard contact={contactWithoutAvatar} />);
        const avatar = container.querySelector(".mx_BaseAvatar");
        expect(avatar).toBeInTheDocument();
    });
});
