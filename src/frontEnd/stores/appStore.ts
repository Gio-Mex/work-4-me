import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { toast } from "../components/ui/toast";

const baseUrl = import.meta.env.VITE_BASE_URL;

const socketInstance: Socket = io(baseUrl, { transports: ["websocket"] });

export const useAppStore = defineStore("app", {
  state: () => ({
    socket: socketInstance, 
    isLoading: false,
  }),
  actions: {
    startLoading() {
      this.isLoading = true;
    },
    stopLoading() {
      this.isLoading = false;
    },
    showToast(description: string) {
      toast({
        description: description,
        duration: 3000,
      });
    },
  },
});