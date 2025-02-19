import { defineStore } from "pinia";
import { io } from "socket.io-client";
import { toast } from "../components/ui/toast";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const useAppStore = defineStore("app", {
  state: () => ({
    socket: io(baseUrl, { transports: ["websocket"] }),
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
