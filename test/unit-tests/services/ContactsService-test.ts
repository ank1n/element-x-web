/*
Copyright 2026 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { mocked } from "jest-mock";
import { type MatrixClient, type Room, type User, type MatrixEvent } from "matrix-js-sdk/src/matrix";
import { PresenceState } from "matrix-js-sdk/src/types";

import { ContactsService, CONTACTS_UPDATE_EVENT } from "../../../src/services/ContactsService";
import DMRoomMap from "../../../src/utils/DMRoomMap";

describe("ContactsService", () => {
    let service: ContactsService;
    let mockClient: MatrixClient;
    let dmRoomMap: DMRoomMap;

    beforeEach(() => {
        service = ContactsService.sharedInstance();

        mockClient = {
            getRooms: jest.fn(),
            getUser: jest.fn(),
            getUserId: jest.fn(),
            on: jest.fn(),
            removeListener: jest.fn(),
        } as unknown as MatrixClient;

        dmRoomMap = {
            getUserIdForRoomId: jest.fn(),
        } as unknown as DMRoomMap;

        DMRoomMap.setShared(dmRoomMap);
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

    describe("getContacts", () => {
        it("should return empty array when no DM rooms", async () => {
            mocked(mockClient.getRooms).mockReturnValue([]);
            service.start(mockClient);

            const contacts = await service.getContacts();
            expect(contacts).toEqual([]);
        });

        it("should extract contacts from DM rooms", async () => {
            const userId = "@user:example.com";
            const roomId = "!room:example.com";

            const mockRoom = {
                roomId,
                getMyMembership: jest.fn().mockReturnValue("join"),
            } as unknown as Room;

            const mockUser = {
                userId,
                displayName: "Test User",
                avatarUrl: "mxc://example.com/avatar",
            } as unknown as User;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(mockClient.getUser).mockReturnValue(mockUser);
            mocked(mockClient.getUserId).mockReturnValue("@me:example.com");
            mocked(dmRoomMap.getUserIdForRoomId).mockReturnValue(userId);

            service.start(mockClient);
            const contacts = await service.getContacts();

            expect(contacts).toHaveLength(1);
            expect(contacts[0]).toMatchObject({
                id: userId,
                displayName: "Test User",
                roomId: roomId,
            });
        });

        it("should skip rooms where user is not joined", async () => {
            const mockRoom = {
                roomId: "!room:example.com",
                getMyMembership: jest.fn().mockReturnValue("leave"),
            } as unknown as Room;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(dmRoomMap.getUserIdForRoomId).mockReturnValue("@user:example.com");

            service.start(mockClient);
            const contacts = await service.getContacts();

            expect(contacts).toHaveLength(0);
        });

        it("should skip rooms that are not DM rooms", async () => {
            const mockRoom = {
                roomId: "!room:example.com",
                getMyMembership: jest.fn().mockReturnValue("join"),
            } as unknown as Room;

            mocked(mockClient.getRooms).mockReturnValue([mockRoom]);
            mocked(dmRoomMap.getUserIdForRoomId).mockReturnValue(null);

            service.start(mockClient);
            const contacts = await service.getContacts();

            expect(contacts).toHaveLength(0);
        });
    });

    describe("getPresence", () => {
        it("should return false when user not found", () => {
            mocked(mockClient.getUser).mockReturnValue(null);
            service.start(mockClient);

            const isOnline = service.getPresence("@user:example.com");
            expect(isOnline).toBe(false);
        });

        it("should return true for online user", () => {
            const mockUser = {
                presence: PresenceState.Online,
            } as unknown as User;

            mocked(mockClient.getUser).mockReturnValue(mockUser);
            service.start(mockClient);

            const isOnline = service.getPresence("@user:example.com");
            expect(isOnline).toBe(true);
        });

        it("should return false for offline user", () => {
            const mockUser = {
                presence: PresenceState.Offline,
            } as unknown as User;

            mocked(mockClient.getUser).mockReturnValue(mockUser);
            service.start(mockClient);

            const isOnline = service.getPresence("@user:example.com");
            expect(isOnline).toBe(false);
        });

        it("should return false for unavailable user", () => {
            const mockUser = {
                presence: PresenceState.Unavailable,
            } as unknown as User;

            mocked(mockClient.getUser).mockReturnValue(mockUser);
            service.start(mockClient);

            const isOnline = service.getPresence("@user:example.com");
            expect(isOnline).toBe(false);
        });
    });

    describe("events", () => {
        it("should emit CONTACTS_UPDATE_EVENT on presence change", () => {
            const listener = jest.fn();
            service.on(CONTACTS_UPDATE_EVENT, listener);
            service.start(mockClient);

            // Get the event handler registered with mockClient.on
            const eventHandler = mocked(mockClient.on).mock.calls.find(
                (call) => call[0] === "User.presence",
            )?.[1];

            // Simulate presence event
            const mockEvent = {} as MatrixEvent;
            const mockUser = { userId: "@user:example.com" } as User;

            eventHandler?.(mockEvent, mockUser);

            expect(listener).toHaveBeenCalledWith(mockEvent, mockUser);
        });
    });

    describe("singleton", () => {
        it("should return the same instance", () => {
            const instance1 = ContactsService.sharedInstance();
            const instance2 = ContactsService.sharedInstance();

            expect(instance1).toBe(instance2);
        });
    });
});
