import { defineStore } from "pinia";
import api from "../utils/axios";
import { useAppStore } from "./appStore";
import type { Job } from "../interfaces/job";
import type { Chat } from "../interfaces/chat";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const useJobStore = defineStore("job", {
  state: () => ({
    jobs: [] as Job[],
    categories: [
      "Idraulica",
      "Elettricità",
      "Elettronica",
      "Restauro",
      "Lavori in legno",
      "Lavori in ferro",
      "Verniciatura",
      "Lavori domestici",
      "Cucina",
      "Cucito",
      "Makeup",
      "Hairstyle",
      "Nail art",
      "Altro",
    ] as string[],
    notifications: [] as string[],
  }),
  actions: {
    // Fetch active jobs function
    async fetchActiveJobs() {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      // Fetch data
      try {
        const url = `${baseUrl}/jobs`;
        const response = await api.get(url);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dei lavori:", error);
        // Show message
        if (this.jobs.length !== 0) {
          appStore.showToast(error.response.data.message);
          return;
        }
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Fetch archived jobs function
    async fetchArchivedJobs() {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/archived`;
        const response = await api.get(url);
        console.log("Risposta dal server:", response.data);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dell'archivio:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Create job function
    async createJob(job: Job) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/new`;
        const response = await api.post(url, job);
        this.jobs.push(response.data);
        // Show message
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la creazione della richiesta:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Update job function
    async updateJob(job: Job) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/edit/${job._id}`;
        const response = await api.put(url, job);
        job = response.data;
        console.log("Risposta dal server: Status", response.status);
        // Show message
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la modifica della richiesta:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Update job store function
    async updateJobStore(updatedJob: Job) {
      const index = this.jobs.findIndex((job) => job._id === updatedJob._id);
      if (index !== -1) {
        this.jobs[index] = updatedJob;
      } else {
        this.jobs.push(updatedJob);
      }
    },

    // Set new offer function
    async newOffer(job: Job) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/${job._id}`;
        const response = await api.patch(url, job);
        console.log("Risposta dal server: Status", response.status);
        // Show message
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la proposta:", error);
        // Show message
        appStore.showToast(error.response.data.message);
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Delete notification function
    deleteNotification(notificationId: string) {
      return (this.notifications = this.notifications.filter(
        (notification) => notification !== notificationId
      ));
    },

    // Delete all user jobs from store function
    deleteAllStoreUserJobs(userId: string) {
      this.jobs = this.jobs.filter((job) => job.userId !== userId);
    },

    // Delete job from store function
    deleteJobFromStore(jobId: string) {
      this.jobs = this.jobs.filter((job) => job._id !== jobId);
    },

    // Delete job function
    async deleteJob(jobId: string) {
      // Start loader
      const appStore = useAppStore();
      const socket = appStore.socket;
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/${jobId}`;
        const response = await api.delete(url);
        console.log("Risposta dal server: Status", response.status);
        // Show message
        appStore.showToast(response.data.message);
        // Emit a deleteJob event via socket
        socket.emit("deleteJob", jobId);
      } catch (error: any) {
        console.error(
          "Errore durante la cancellazione della richiesta:",
          error
        );
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Update chat function
    async updateChat(chat: Chat) {
      const appStore = useAppStore();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/${chat.jobId}`;
        const response = await api.post(url, chat);
        console.log("Risposta dal server: Status", response.status);
      } catch (error: any) {
        console.error("Errore durante la creazione della chat:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      }
    },

    // Fetch chat function
    async fetchChat(jobId: string) {
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/chat/${jobId}`;
        const response = await api.get(url);
        return response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero della chat:", error);
        throw error;
      }
    },

    // Rate worker function
    async rateWorker(workerId: string, ratings: Object) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/user/ratings/${workerId}`;
        const response = await api.patch(url, { ratings });
        console.log("Risposta dal server: Status", response.status);
      } catch (error: any) {
        console.error("Errore durante la valutazione:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },
  },
  // Persist state
  persist: true,
});
