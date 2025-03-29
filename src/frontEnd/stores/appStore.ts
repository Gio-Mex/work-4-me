import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { useJobStore } from "./jobStore";
import { useUserStore } from "./userStore";
import type { Job } from "../interfaces/job";
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

    // Show message via toast
    showToast(description: string) {
      toast({
        description: description,
        duration: 3000,
      });
    },

    // Delete notifications from stores and database
    async deleteAllNotifications(job: Job) {
      const jobStore = useJobStore();
      const userStore = useUserStore();
      if (jobStore.notifications.includes(job._id!)) {
        jobStore.deleteNotification(job._id!);
        await userStore.deleteNotifications(job._id!);
      }
      if (userStore.user!.notifications?.includes(job._id!)) {
        userStore.user!.notifications = userStore.user!.notifications.filter(
          (notificationId) => notificationId !== job._id
        );
        await userStore.deleteNotifications(job._id!);
      }
    }
  },
});
