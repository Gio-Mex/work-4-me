import { defineStore } from "pinia";
import axios from "axios";
import { ref } from "vue";
import type { User } from "../interfaces/user";
import { useAppStore } from "./appStore";

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
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        // Show message
        appStore.showToast(response.data.message);
        this.user = user;
        // Save auth token in local storage
        localStorage.setItem("authToken", token);
        this.isLoggedIn = true;
        // Connect socket
        socket.connect();
        // Emit registerUser event
        //socket.emit("registerUser", user._id);
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
        console.log("Risposta dal server:", {
          status: response.status,
          messaggio: response.statusText,
        });
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
        // Fetch data
        const url = `${baseUrl}/user/${this.user!._id}`;
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
        // Fetch data
        const url = `${baseUrl}/user/ratings/${this.user!._id}`;
        const response = await axios.get(url);
        this.user!.ratings = response.data as { quality: number[]; reliability: number[] };
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
        // Fetch data
        const url = `${baseUrl}/user/${this.user!._id}`;
        const response = await axios.put(url, user);
        const { updatedUser } = response.data as { updatedUser: User };
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
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
        // Fetch data
        const url = `${baseUrl}/user/notifications/${this.user!._id}/${jobId}`;
        const response = await axios.delete(url);
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
      } catch (error: any) {
        console.error(
          "Errore durante la cancellazione delle notifiche:",
          error
        );
        throw error;
      }
    },

    // Delete user function
    async deleteUser() {
      // Start loader
      const appStore = useAppStore();
      appStore.startLoading();
      try {
        // Fetch data
        const url = `${baseUrl}/user`;
        const response = await axios.delete(url, {
          params: {
            _id: this.user!._id,
          },
        });
        const status = response.status;
        console.log("Risposta dal server:", {
          status,
          message: response.statusText,
        });
        // Remove user
        this.resetUser();
        // Show message
        appStore.showToast(response.data.message);
      } catch (error: any) {
        console.error("Errore durante la cancellazione:", error);
        // Show message
        appStore.showToast(error.response.data.message);
        throw error;
      } finally {
        // Stop loader
        appStore.stopLoading();
      }
    },
    
    // Reset user function
    resetUser() {
      this.isLoggedIn = false;
      this.user = null;
      localStorage.clear();
    },
  },
  // Persist state
  persist: true,
});
