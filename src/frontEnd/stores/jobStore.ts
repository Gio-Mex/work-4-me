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
    async fetchActiveJobs() {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs`;
        const response = await axios.get(url);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dei lavori:", error);
        if (this.jobs.length !== 0) {
          appStore.showToast(error.response.data.message);
          return;
        }
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
    async fetchArchivedJobs(id: string) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/${id}/archived`;
        const response = await axios.get(url);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dell'archivio:", error);
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
    async createJob(job: Job) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/new`;
        const response = await axios.post(url, job);
        this.jobs.push(response.data);
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la creazione della richiesta:", error);
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
    async findJob(jobToFind: Job) {
      const index = this.jobs.findIndex((job) => job._id === jobToFind._id);
      if (index !== -1) {
        return this.jobs[index];
      }
    },
    async updateJob(job: Job) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/edit/${job._id}`;
        const response = await axios.put(url, job);
        job = response.data;
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la modifica della richiesta:", error);
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
    updateJobFromSocket(updatedJob: Job) {
      const index = this.jobs.findIndex((job) => job._id === updatedJob._id);
      if (index !== -1) {
        this.jobs[index] = updatedJob;
      } else {
        return this.jobs;
      }
    },
    async newOffer(job: Job) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/${job._id}`;
        const response = await axios.patch(url, job);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la proposta:", error);
        appStore.showToast(error.response.data.message);
      } finally {
        appStore.stopLoading();
      }
    },

    deleteNotification(notificationId: string) {
      this.notifications = this.notifications.filter(
        (notification) => notification !== notificationId
      );
    },
    async deleteJob(jobId: string) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/jobs/${jobId}`;
        const response = await axios.delete(url);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error(
          "Errore durante la cancellazione della richiesta:",
          error
        );
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
    async updateChat(chat: Chat) {
      const appStore = useAppStore();
      try {
        const url = `${baseUrl}/jobs/${chat.jobId}`;
        const response = await axios.post(url, chat);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
      } catch (error: any) {
        console.error("Errore durante la creazione della chat:", error);
        appStore.showToast(error.response.data.message);
        throw error;
      }
    },
    async fetchChat(jobId: string) {
      try {
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
    async rateWorker(workerId: string, ratings: Object) {
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        const url = `${baseUrl}/user/${workerId}`;
        const response = await axios.patch(url, { ratings });
        console.log(response.data);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response,
        });
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la valutazione:", error);
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        appStore.stopLoading();
      }
    },
  },
  getters: {
    // getJobById:
    //   (state) =>
    //   (id: string) => {
    //     const job = state.jobs.find((job) => job._id === id);
    //     if (!job) {
    //       throw new Error(`Job con ID ${id} not trovato`);
    //     }
    //     return job;
    //   },
    getNotification: (state) => (id: string) => {
      const notification = state.notifications.find(
        (notificationId) => notificationId === id
      );
      if (!notification) {
        throw new Error(`Notification con ID ${id} not trovato`);
      }
      return notification;
    },
  },
  persist: true,
});
