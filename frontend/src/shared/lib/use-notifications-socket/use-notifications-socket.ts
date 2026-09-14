import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { tokenService } from "../../../utils/tokenService";
import { SOCKET_URL } from "./socket-config";
import type {
  TSocketNotification,
  TUseNotificationsSocketOptions,
} from "./types";

const NOTIFICATION_EVENT = "notificateNewRequest";

export const useNotificationsSocket = ({
  enabled,
  onNotification,
}: TUseNotificationsSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const notificationHandlerRef = useRef(onNotification);

  useEffect(() => {
    notificationHandlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = tokenService.get();

    if (!token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      query: {
        token,
      },
      reconnection: true,
    });

    socketRef.current = socket;

    const handleNotification = (notification: TSocketNotification) => {
      notificationHandlerRef.current(notification);
    };

    socket.on(NOTIFICATION_EVENT, handleNotification);

    return () => {
      socket.off(NOTIFICATION_EVENT, handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return socketRef;
};
