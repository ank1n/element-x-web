/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import CallHistoryCard from "../../../../../src/components/views/calls/CallHistoryCard";
import { type CallHistoryItem, CallType } from "../../../../../src/models/CallHistoryItem";

describe("CallHistoryCard", () => {
    const baseCall: CallHistoryItem = {
        id: "call123",
        contactName: "Test User",
        contactId: "@user:example.com",
        callType: CallType.INCOMING,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isMissed: false,
        roomId: "!room:example.com",
    };

    it("should render contact name", () => {
        render(<CallHistoryCard call={baseCall} />);
        expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("should show incoming call icon", () => {
        render(<CallHistoryCard call={baseCall} />);
        expect(screen.getByText("↙")).toBeInTheDocument();
    });

    it("should show outgoing call icon", () => {
        const outgoingCall = { ...baseCall, callType: CallType.OUTGOING };
        render(<CallHistoryCard call={outgoingCall} />);
        expect(screen.getByText("↗")).toBeInTheDocument();
    });

    it("should show video call icon", () => {
        const videoCall = { ...baseCall, callType: CallType.VIDEO };
        render(<CallHistoryCard call={videoCall} />);
        expect(screen.getByText("📹")).toBeInTheDocument();
    });

    it("should show missed call label", () => {
        const missedCall = { ...baseCall, isMissed: true };
        render(<CallHistoryCard call={missedCall} />);
        expect(screen.getByText("Missed")).toBeInTheDocument();
    });

    it("should show call duration when provided", () => {
        const callWithDuration = { ...baseCall, duration: 125 }; // 2:05
        render(<CallHistoryCard call={callWithDuration} />);
        expect(screen.getByText("2:05")).toBeInTheDocument();
    });

    it("should format duration correctly", () => {
        const callWithDuration = { ...baseCall, duration: 65 }; // 1:05
        render(<CallHistoryCard call={callWithDuration} />);
        expect(screen.getByText("1:05")).toBeInTheDocument();
    });

    it("should show recording indicator when recording available", () => {
        const callWithRecording = {
            ...baseCall,
            recordingURL: "https://example.com/recording.mp3",
        };
        render(<CallHistoryCard call={callWithRecording} />);
        expect(screen.getByText("~~~")).toBeInTheDocument();
    });

    it("should show play button when recording available", () => {
        const callWithRecording = {
            ...baseCall,
            recordingURL: "https://example.com/recording.mp3",
        };
        render(<CallHistoryCard call={callWithRecording} />);
        expect(screen.getByTitle("Play recording")).toBeInTheDocument();
    });

    it("should call onPlayRecording when play button clicked", () => {
        const onPlayRecording = jest.fn();
        const recordingURL = "https://example.com/recording.mp3";
        const callWithRecording = { ...baseCall, recordingURL };

        render(<CallHistoryCard call={callWithRecording} onPlayRecording={onPlayRecording} />);

        const playButton = screen.getByTitle("Play recording");
        fireEvent.click(playButton);

        expect(onPlayRecording).toHaveBeenCalledWith(recordingURL);
    });

    it("should not show play button when no recording", () => {
        render(<CallHistoryCard call={baseCall} />);
        expect(screen.queryByTitle("Play recording")).not.toBeInTheDocument();
    });

    it("should show relative timestamp", () => {
        const { container } = render(<CallHistoryCard call={baseCall} />);
        const timestamp = container.querySelector(".mx_CallHistoryCard_timestamp");
        expect(timestamp).toBeInTheDocument();
        expect(timestamp?.textContent).toMatch(/ago|yesterday/);
    });

    it("should apply missed call style", () => {
        const missedCall = { ...baseCall, isMissed: true };
        const { container } = render(<CallHistoryCard call={missedCall} />);
        const card = container.querySelector(".mx_CallHistoryCard_missed");
        expect(card).toBeInTheDocument();
    });
});
