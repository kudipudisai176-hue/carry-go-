/// <reference types="vite/client" />
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.DEV ? "http://localhost:5000" : window.location.origin;

export const socket = io(SOCKET_URL, {
  path: "/_/backend/socket.io",
  autoConnect: false,
});

export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit("join_user_notifications", userId);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
