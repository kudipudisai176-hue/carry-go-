import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
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
