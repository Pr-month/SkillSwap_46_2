/** @jest-environment jsdom */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { io, type Socket } from "socket.io-client";
import { tokenService } from "../../../utils/tokenService";
import { useNotificationsSocket } from "./use-notifications-socket";
import type { TSocketNotification } from "./types";

type TNotificationListener = (notification: TSocketNotification) => void;

const mockOn =
  jest.fn<(event: string, listener: TNotificationListener) => void>();
const mockOff =
  jest.fn<(event: string, listener: TNotificationListener) => void>();
const mockDisconnect = jest.fn<() => void>();

const mockSocket = {
  on: mockOn,
  off: mockOff,
  disconnect: mockDisconnect,
};

jest.mock("./socket-config", () => ({
  SOCKET_URL: "http://localhost:3000",
}));

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

jest.mock("../../../utils/tokenService", () => ({
  tokenService: {
    get: jest.fn(),
  },
}));

const mockedIo = jest.mocked(io);
const mockedTokenGet = jest.mocked(tokenService.get);

describe("useNotificationsSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIo.mockReturnValue(mockSocket as unknown as Socket);
  });

  test("does not connect when notifications are disabled", () => {
    mockedTokenGet.mockReturnValue("access-token");

    renderHook(() =>
      useNotificationsSocket({
        enabled: false,
        onNotification: jest.fn(),
      }),
    );

    expect(mockedIo).not.toHaveBeenCalled();
  });

  test("does not connect when the access token is missing", () => {
    mockedTokenGet.mockReturnValue(null);

    renderHook(() =>
      useNotificationsSocket({
        enabled: true,
        onNotification: jest.fn(),
      }),
    );

    expect(mockedIo).not.toHaveBeenCalled();
  });

  test("connects with the token expected by the backend guard", () => {
    mockedTokenGet.mockReturnValue("access-token");

    renderHook(() =>
      useNotificationsSocket({
        enabled: true,
        onNotification: jest.fn(),
      }),
    );

    expect(mockedIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transports: ["websocket"],
        query: {
          token: "access-token",
        },
        reconnection: true,
      }),
    );
  });

  test("passes received notifications to the current handler", () => {
    mockedTokenGet.mockReturnValue("access-token");

    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    const { rerender } = renderHook(
      ({ handler }: { handler: (value: TSocketNotification) => void }) =>
        useNotificationsSocket({
          enabled: true,
          onNotification: handler,
        }),
      {
        initialProps: {
          handler: firstHandler,
        },
      },
    );

    rerender({
      handler: secondHandler,
    });

    const listenerCall = mockOn.mock.calls.find(
      ([eventName]) => eventName === "notificateNewRequest",
    );

    expect(listenerCall).toBeDefined();

    const listener = listenerCall?.[1] as TNotificationListener;

    const notification: TSocketNotification = {
      id: "notification-id",
      type: "NEW_REQUEST",
      skillName: "TypeScript",
      fromUser: "Алексей",
      isRead: false,
      createdAt: "2026-09-14T20:00:00.000Z",
    };

    listener?.(notification);

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith(notification);
  });

  test("removes the listener and disconnects on unmount", () => {
    mockedTokenGet.mockReturnValue("access-token");

    const { unmount } = renderHook(() =>
      useNotificationsSocket({
        enabled: true,
        onNotification: jest.fn(),
      }),
    );

    const listenerCall = mockOn.mock.calls.find(
      ([eventName]) => eventName === "notificateNewRequest",
    );

    const listener = listenerCall?.[1] as TNotificationListener;

    unmount();

    expect(mockOff).toHaveBeenCalledWith("notificateNewRequest", listener);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
