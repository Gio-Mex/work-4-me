import { defineStore } from "pinia";
import axios from "axios";
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
      // Reset store notifications (to leave only those already saved in database)
      this.notifications = [];
      // Fetch data
      try {
        const url = `${baseUrl}/jobs`;
        const response = await axios.get(url);
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
    async fetchArchivedJobs(id: string) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/${id}/archived`;
        const response = await axios.get(url);
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
        const response = await axios.post(url, job);
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
        const response = await axios.put(url, job);
        job = response.data;
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
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
        const response = await axios.patch(url, job);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
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

    // Delete job function
    async deleteJob(jobId: string) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/jobs/${jobId}`;
        const response = await axios.delete(url);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        // Show message
        appStore.showToast(response.data.message);
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
        const response = await axios.post(url, chat);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
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
        const url = `${baseUrl}/jobs/${jobId}`;
        const response = await axios.get(url);
        return response.data;
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.warn("Chat non trovata:", jobId);
          return null;
        }
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
        const response = await axios.patch(url, { ratings });
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response,
        });
        // Show message
        appStore.showToast(response.data.message);
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
