/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { mocked } from "jest-mock";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";

import { RecordingService, RECORDING_STATE_CHANGED } from "../../../src/services/RecordingService";

// Mock fetch
global.fetch = jest.fn();

describe("RecordingService", () => {
    let service: RecordingService;
    let mockClient: MatrixClient;

    beforeEach(() => {
        service = RecordingService.sharedInstance();
        mockClient = {} as MatrixClient;
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        service.stop();
        jest.useRealTimers();
    });

    describe("startRecording", () => {
        it("should start recording and emit state change", async () => {
            const roomId = "!room:example.com";
            const egressId = "egress123";

            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ egressId }),
            } as Response);

            const listener = jest.fn();
            service.on(RECORDING_STATE_CHANGED, listener);
            service.start(mockClient);

            const state = await service.startRecording(roomId);

            expect(state.egressId).toBe(egressId);
            expect(state.roomId).toBe(roomId);
            expect(state.status).toBe("recording");
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: "recording" }));
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/start"),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ roomName: roomId }),
                }),
            );
        });

        it("should handle API errors", async () => {
            const roomId = "!room:example.com";

            mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Server Error",
            } as Response);

            service.start(mockClient);

            await expect(service.startRecording(roomId)).rejects.toThrow("Failed to start recording");
        });

        it("should emit failed state on error", async () => {
            const roomId = "!room:example.com";

            mocked(fetch).mockRejectedValue(new Error("Network error"));

            const listener = jest.fn();
            service.on(RECORDING_STATE_CHANGED, listener);
            service.start(mockClient);

            await expect(service.startRecording(roomId)).rejects.toThrow();
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
        });
    });

    describe("stopRecording", () => {
        it("should stop recording and start polling", async () => {
            const roomId = "!room:example.com";
            const egressId = "egress123";

            // Start recording first
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ egressId }),
            } as Response);

            service.start(mockClient);
            await service.startRecording(roomId);

            // Stop recording
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);

            const state = await service.stopRecording(roomId);

            expect(state.status).toBe("processing");
            expect(state.endedAt).toBeDefined();
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/stop"),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ egressId }),
                }),
            );
        });

        it("should throw error when no active recording", async () => {
            service.start(mockClient);

            await expect(service.stopRecording("!room:example.com")).rejects.toThrow(
                "No active recording for this room",
            );
        });

        it("should poll for completion and emit ready state", async () => {
            const roomId = "!room:example.com";
            const egressId = "egress123";
            const downloadUrl = "https://example.com/recording.mp3";

            // Start recording
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ egressId }),
            } as Response);

            service.start(mockClient);
            await service.startRecording(roomId);

            // Stop recording
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);

            // Poll status - first processing, then ready
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 0 }), // Processing
            } as Response);

            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 1, downloadUrl }), // Ready
            } as Response);

            const listener = jest.fn();
            service.on(RECORDING_STATE_CHANGED, listener);

            await service.stopRecording(roomId);

            // Advance timers to trigger polling
            await jest.advanceTimersByTimeAsync(1000);

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "ready",
                    downloadUrl,
                }),
            );
        });

        it("should emit failed state on polling error", async () => {
            const roomId = "!room:example.com";
            const egressId = "egress123";

            // Start recording
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ egressId }),
            } as Response);

            service.start(mockClient);
            await service.startRecording(roomId);

            // Stop recording
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);

            // Poll status - return error
            mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 2, error: "Processing failed" }),
            } as Response);

            const listener = jest.fn();
            service.on(RECORDING_STATE_CHANGED, listener);

            await service.stopRecording(roomId);

            // Advance timers to trigger polling
            await jest.advanceTimersByTimeAsync(1000);

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "failed",
                    error: "Processing failed",
                }),
            );
        });
    });

    describe("getRecordingState", () => {
        it("should return null when no recording", () => {
            service.start(mockClient);
            const state = service.getRecordingState("!room:example.com");
            expect(state).toBeNull();
        });

        it("should return recording state", async () => {
            const roomId = "!room:example.com";

            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ egressId: "egress123" }),
            } as Response);

            service.start(mockClient);
            await service.startRecording(roomId);

            const state = service.getRecordingState(roomId);
            expect(state).not.toBeNull();
            expect(state?.status).toBe("recording");
        });
    });

    describe("deleteRecording", () => {
        it("should delete recording via API", async () => {
            const egressId = "egress123";

            mocked(fetch).mockResolvedValue({
                ok: true,
            } as Response);

            service.start(mockClient);
            await service.deleteRecording(egressId);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining("/delete"),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ egressId }),
                }),
            );
        });

        it("should throw error on API failure", async () => {
            mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: "Not Found",
            } as Response);

            service.start(mockClient);

            await expect(service.deleteRecording("egress123")).rejects.toThrow();
        });
    });

    describe("getRecordingsForRoom", () => {
        it("should fetch recordings from API", async () => {
            const roomId = "!room:example.com";
            const recordings = [
                {
                    egressId: "egress1",
                    roomName: roomId,
                    status: 1,
                    downloadUrl: "https://example.com/recording.mp3",
                },
            ];

            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ recordings }),
            } as Response);

            service.start(mockClient);
            const result = await service.getRecordingsForRoom(roomId);

            expect(result).toEqual(recordings);
        });
    });

    describe("singleton", () => {
        it("should return the same instance", () => {
            const instance1 = RecordingService.sharedInstance();
            const instance2 = RecordingService.sharedInstance();

            expect(instance1).toBe(instance2);
        });
    });
});
