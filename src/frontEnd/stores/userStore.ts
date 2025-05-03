import { defineStore } from "pinia";
import axios from "axios";
import { ref } from "vue";
import type { User } from "../interfaces/user";
import { useAppStore } from "./appStore";
import { useJobStore } from "./jobStore";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
  }),
  actions: {
    // Login function
    async login(form: User) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      const socket = appStore.socket;
      try {
        // Fetch data
        const url = `${baseUrl}/user/login`;
        const response = await axios.post(url, form);
        const { user, token } = response.data;
        console.log("Risposta dal server: Status", response.status);
        // Show message
        appStore.showToast(response.data.message);
        this.user = user;
        // Save auth token in local storage
        localStorage.setItem("authToken", token);
        this.isLoggedIn = true;
        // Connect socket
        socket.connect();
        // Emit registerUser event
        socket.emit("registerUser", user._id);
      } catch (error: any) {
        console.error("Errore durante il login:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Signup function
    async signup(form: User) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/user/signup`;
        const response = await axios.post(url, form);
        console.log("Risposta dal server: Status", response.status);
        if (response.status === 201) {
          // Show message
          appStore.showToast("Account creato con successo");
        }
      } catch (error: any) {
        console.error("Errore durante la registrazione:", error);
        // Show message
        appStore.showToast(error.response.data.message);
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Logout function
    logout() {
      const appStore = useAppStore();
      const socket = appStore.socket;
      // Disconnect socket
      socket.disconnect();
      // Remove user
      this.resetUser();
      // Show message
      appStore.showToast("Logout effettuato");
    },

    // Fetch user function
    async fetchUser() {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/user`;
        const response = await axios.get(url);
        this.user = response.data as User;
      } catch (error) {
        console.error(error);
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Fetch ratings function
    async fetchRatings() {
      try {
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/user/ratings`;
        const response = await axios.get(url);
        this.user!.ratings = response.data as {
          quality: number[];
          reliability: number[];
        };
      } catch (error) {
        console.error(error);
      }
    },

    // Ratings average function
    ratingsAvg(ratings: number[]) {
      const rate = ref(0);
      if (ratings.length > 0) {
        rate.value = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return rate.value;
      } else {
        return;
      }
    },

    // Update user function
    async updateUser(user: User) {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/user`;
        const response = await axios.put(url, user);
        const { updatedUser } = response.data as { updatedUser: User };
        console.log("Risposta dal server: Status", response.status);
        // Show message
        appStore.showToast(response.data.message);
        this.user = updatedUser;
      } catch (error: any) {
        console.error("Errore durante l'aggiornamento:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Delete notifications function
    async deleteNotifications(jobId: string) {
      try {
        if (!this.user) {
          console.error("Utente non trovato");
          return;
        }
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/user/notifications/${jobId}`;
        const response = await axios.patch(url);
        if (response && response.status === 200) {
          console.log(
            "Notifica cancellata con successo. Status:",
            response.status
          );
        } else {
          console.log(
            "La risposta dal server non è corretta o la notifica non è stata trovata."
          );
        }
      } catch (error: any) {
        // Error handling
        console.error(
          "Errore durante la cancellazione delle notifiche:",
          error
        );
      }
    },

    // Delete user function
    async deleteUser() {
      // Start loader
      const appStore = useAppStore();
      const socket = appStore.socket;
      appStore.startLoading();
      await this.deleteAllUserJobs();
      try {
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/user`;
        const response = await axios.delete(url);
        console.log("Risposta dal server: Status", response.status);
        // Emit deleteUser event
        socket.emit("deleteUser", this.user!._id);
        // Remove user
        this.resetUser();
        // Show message
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la cancellazione dell'utente:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },

    // Delete all user jobs function
    async deleteAllUserJobs() {
      try {
        // Fetch data (userId will be extracted from token)
        const url = `${baseUrl}/jobs/user`;
        const response = await axios.delete(url);
        console.log("Risposta dal server: Status", response.status);
      } catch (error: any) {
        console.error("Errore durante la cancellazione dei lavori:", error);
        throw error;
      }
    },

    // Reset user function
    resetUser() {
      const jobStore = useJobStore();
      localStorage.removeItem("authToken");
      this.isLoggedIn = false;
      this.user = null;
      jobStore.jobs = [];
    },
  },
  // Persist state
  persist: true,
});