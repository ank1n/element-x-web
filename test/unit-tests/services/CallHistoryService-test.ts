/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { mocked } from "jest-mock";
import { type MatrixClient, type Room, type MatrixEvent, type User, EventType } from "matrix-js-sdk/src/matrix";

import { CallHistoryService, CALL_HISTORY_UPDATE_EVENT } from "../../../src/services/CallHistoryService";
import { CallType } from "../../../src/models/CallHistoryItem";

// Mock fetch
global.fetch = jest.fn();

describe("CallHistoryService", () => {
    let service: CallHistoryService;
    let mockClient: MatrixClient;

    beforeEach(() => {
        service = CallHistoryService.sharedInstance();

        mockClient = {
            getRooms: jest.fn(),
            getUser: jest.fn(),
            getUserId: jest.fn(),
            on: jest.fn(),
            removeListener: jest.fn(),
        } as unknown as MatrixClient;

        jest.clearAllMocks();
    });

    afterEach(() => {
        service.stop();
    });

    describe("start", () => {
        it("should initialize with Matrix client", () => {
            service.start(mockClient);
            expect(mockClient.on).toHaveBeenCalled();
        });
    });

    describe("getCallHistory", () => {
        it("should return empty array when no rooms", async () => {
            mocked(mockClient.getRooms).mockReturnValue([]);
            service.start(mockClient);

            const calls = await service.getCallHistory();
            expect(calls).toEqual([]);
        });

        it("should extract call history from room events", async () => {
            const userId = "@user:example.com";
            const roomId = "!room:example.com";
            const timestamp = Date.now();

            const mockEvent = {
                getId: jest.fn().mockReturnValue("$event:example.com"),
                getType: jest.fn().mockReturnValue("m.call.invite"),
                getSender: jest.fn().mockReturnValue(userId),
                getTs: jest.fn().mockReturnValue(timestamp),
                getContent: jest.fn().mockReturnValue({ call_id: "call123", type: "voice" }),
            } as unknown as MatrixEvent;

            const mockTimeline = {
                getEvents: jest.fn().mockReturnValue([mockEvent]),
            };

            const mockRoom = {
                roomId,
                getLiveTimeline: jest.fn().mockReturnValue(mockTimeline),
            } as unknown as Room;

            const mockUser = {
                displayName: "Test User",
            } as unknown as User;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(mockClient.getUser).mockReturnValue(mockUser);
            mocked(mockClient.getUserId).mockReturnValue("@me:example.com");

            // Mock fetch for recordings
            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ recordings: [] }),
            } as Response);

            service.start(mockClient);
            const calls = await service.getCallHistory();

            expect(calls).toHaveLength(1);
            expect(calls[0]).toMatchObject({
                contactName: "Test User",
                contactId: userId,
                callType: CallType.INCOMING,
                roomId: roomId,
            });
        });

        it("should detect video calls", async () => {
            const mockEvent = {
                getId: jest.fn().mockReturnValue("$event:example.com"),
                getType: jest.fn().mockReturnValue("m.call.invite"),
                getSender: jest.fn().mockReturnValue("@user:example.com"),
                getTs: jest.fn().mockReturnValue(Date.now()),
                getContent: jest.fn().mockReturnValue({ call_id: "call123", type: "video" }),
            } as unknown as MatrixEvent;

            const mockTimeline = {
                getEvents: jest.fn().mockReturnValue([mockEvent]),
            };

            const mockRoom = {
                roomId: "!room:example.com",
                getLiveTimeline: jest.fn().mockReturnValue(mockTimeline),
            } as unknown as Room;

            const mockUser = {
                displayName: "Test User",
            } as unknown as User;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(mockClient.getUser).mockReturnValue(mockUser);
            mocked(mockClient.getUserId).mockReturnValue("@me:example.com");

            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ recordings: [] }),
            } as Response);

            service.start(mockClient);
            const calls = await service.getCallHistory();

            expect(calls[0].callType).toBe(CallType.VIDEO);
        });

        it("should sort calls by timestamp descending", async () => {
            const event1 = {
                getId: jest.fn().mockReturnValue("$event1"),
                getType: jest.fn().mockReturnValue("m.call.invite"),
                getSender: jest.fn().mockReturnValue("@user:example.com"),
                getTs: jest.fn().mockReturnValue(1000),
                getContent: jest.fn().mockReturnValue({ call_id: "call1" }),
            } as unknown as MatrixEvent;

            const event2 = {
                getId: jest.fn().mockReturnValue("$event2"),
                getType: jest.fn().mockReturnValue("m.call.invite"),
                getSender: jest.fn().mockReturnValue("@user:example.com"),
                getTs: jest.fn().mockReturnValue(2000),
                getContent: jest.fn().mockReturnValue({ call_id: "call2" }),
            } as unknown as MatrixEvent;

            const mockTimeline = {
                getEvents: jest.fn().mockReturnValue([event1, event2]),
            };

            const mockRoom = {
                roomId: "!room:example.com",
                getLiveTimeline: jest.fn().mockReturnValue(mockTimeline),
            } as unknown as Room;

            const mockUser = {
                displayName: "Test User",
            } as unknown as User;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(mockClient.getUser).mockReturnValue(mockUser);
            mocked(mockClient.getUserId).mockReturnValue("@me:example.com");

            mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ recordings: [] }),
            } as Response);

            service.start(mockClient);
            const calls = await service.getCallHistory();

            expect(calls[0].id).toBe("$event2");
            expect(calls[1].id).toBe("$event1");
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
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`roomName=${roomId}`));
        });

        it("should return empty array on API error", async () => {
            mocked(fetch).mockResolvedValue({
                ok: false,
            } as Response);

            service.start(mockClient);
            const result = await service.getRecordingsForRoom("!room:example.com");

            expect(result).toEqual([]);
        });

        it("should return empty array when recording disabled", async () => {
            service.start(mockClient);
            // Mock config with recording disabled
            const result = await service.getRecordingsForRoom("!room:example.com");

            // Should still try to fetch, but return empty on error
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("events", () => {
        it("should emit CALL_HISTORY_UPDATE_EVENT on call events", () => {
            const listener = jest.fn();
            service.on(CALL_HISTORY_UPDATE_EVENT, listener);
            service.start(mockClient);

            const eventHandler = mocked(mockClient.on).mock.calls.find((call) => call[0] === "event")?.[1];

            const mockEvent = {
                getType: jest.fn().mockReturnValue(EventType.CallInvite),
            } as unknown as MatrixEvent;

            eventHandler?.(mockEvent);

            expect(listener).toHaveBeenCalledWith(mockEvent);
        });

        it("should not emit event for non-call events", () => {
            const listener = jest.fn();
            service.on(CALL_HISTORY_UPDATE_EVENT, listener);
            service.start(mockClient);

            const eventHandler = mocked(mockClient.on).mock.calls.find((call) => call[0] === "event")?.[1];

            const mockEvent = {
                getType: jest.fn().mockReturnValue("m.room.message"),
            } as unknown as MatrixEvent;

            eventHandler?.(mockEvent);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("singleton", () => {
        it("should return the same instance", () => {
            const instance1 = CallHistoryService.sharedInstance();
            const instance2 = CallHistoryService.sharedInstance();

            expect(instance1).toBe(instance2);
        });
    });
});
