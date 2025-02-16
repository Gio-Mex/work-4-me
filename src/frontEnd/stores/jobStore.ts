import { defineStore } from "pinia";
import axios from "axios";
import type { Job } from "../interfaces/job";
import type { Chat } from "../interfaces/chat";

import { toast } from "../components/ui/toast";

const showToast = (description: string, variant: any, duration: number) => {
  toast({
    description: description,
    variant: variant,
    duration: duration,
  });
};

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
    notify: false as boolean,
  }),
  actions: {
    async fetchActiveJobs() {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}/jobs`;
        const response = await axios.get(url);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dei lavori:", error);
        if (this.jobs.length !== 0) {
          showToast(error.response.data.message, "default", 3000);
          return;
        }
        throw error;
      }
    },
    async fetchArchivedJobs(id: string) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/${id}/archived`;
        const response = await axios.get(url);
        this.jobs = response.data;
      } catch (error: any) {
        console.error("Errore durante il recupero dell'archivio:", error);
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    },
    async createJob(job: Job) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/new`;
        const response = await axios.post(
          url,
          job
        );
        this.jobs.push(response.data);
        showToast(response.data.message, "default", 3000);
      } catch (error: any) {
        console.error("Errore durante la creazione della richiesta:", error);
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    },
    async findJob(jobToFind: Job) {
      const index = this.jobs.findIndex((job) => job._id === jobToFind._id);
      if (index !== -1) {
        return this.jobs[index];
      }
    },
    async updateJob(job: Job) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/edit/${job._id}`;
        const response = await axios.put(
          url,
          job
        );
        job = this.getJobById(job._id as string);
        job = response.data;
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        showToast(response.data.message, "default", 3000);
      } catch (error: any) {
        console.error("Errore durante la modifica della richiesta:", error);
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    },

    async newOffer(job: Job) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/${job._id}`;
        const response = await axios.patch(
          url,
          job
        );
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        showToast(response.data.message, "default", 3000);
      } catch (error: any) {
        console.error("Errore durante la proposta:", error);
        showToast(error.response.data.message, "destructive", 3000);
      }
    },
    async deleteJob(jobId: string) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/${jobId}`;
        const response = await axios.delete(url);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        showToast(response.data.message, "default", 3000);
      } catch (error: any) {
        console.error(
          "Errore durante la cancellazione della richiesta:",
          error
        );
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    },
    async updateChat(chat: Chat) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/${chat.jobId}`;
        const response = await axios.post(
          url,
          chat
        );
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
      } catch (error: any) {
        console.error("Errore durante la creazione della chat:", error);
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    },
    async fetchChat(jobId: string) {
      try {
        const url = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_PORT}/jobs/${jobId}`;
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
      try {
        const url = `http://localhost:3000/user/${workerId}`;
        const response = await axios.patch(
          url,
          {ratings}
        );
        console.log(response.data);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response,
        });
        showToast(response.data.message, "default", 3000);
      } catch (error: any) {
        console.error("Errore durante la valutazione:", error);
        showToast(error.response.data.message, "destructive", 3000);
        throw error;
      }
    }
  },
  getters: {
    getJobById:
      (state) =>
      (id: string): Job => {
        const job = state.jobs.find((job) => job._id === id);
        if (!job) {
          throw new Error(`Job con ID ${id} not trovato`);
        }
        return job;
      },
  },
  persist: true,
});
