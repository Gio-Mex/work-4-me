import { io } from "socket.io-client";

const url = import.meta.env.VITE_BASE_URL;
export const socket = io(url, {
  transports: ["websocket"],
  autoConnect: false,
});