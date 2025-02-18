import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "../interfaces/user";
import { useAppStore } from "./appStore";
import { ref } from "vue";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const useUserStore = defineStore(
  "user",
  {
    state: () => ({
      user: null as User | null,
      isLoggedIn: false,
    }),
    actions: {
      async login(form : User) {
        const appStore = useAppStore();
        appStore.startLoading();
        try {
          const url = `${baseUrl}/user/login`;
          const response = await axios.post(
            url,
            form
          );
          const { user, token } = response.data;
          const status = response.status;
          console.log("Risposta dal server:", {
            status,
            message: response.statusText,
          });
          appStore.showToast(response.data.message);
          this.user = user;
          localStorage.setItem("authToken", token);
          this.isLoggedIn = true;
        } catch (error: any) {
          console.error("Errore durante il login:", error);
          appStore.showToast(error.response.data.message);
          throw error;
        } finally {
          appStore.stopLoading();
        }
      },
      async signup(form : User) {
        const appStore = useAppStore();
        appStore.startLoading();
        try {
          const url = `${baseUrl}/user/signup`;
          const response = await axios.post(
            url,
            form
          );
          console.log(
            "Risposta dal server:", {status: response.status, messaggio: response.statusText},
          );
      
          if (response.status === 201) {
            appStore.showToast("Account creato con successo");
          }
        } catch (error : any) {
          console.error("Errore durante la registrazione:", error);
          appStore.showToast(error.response.data.message);
        } finally {
          appStore.stopLoading();
        }
      },
      logout() {
        const appStore = useAppStore();
        this.resetUser();
        appStore.showToast("Logout effettuato");
      },
      async fetchUser() {
        const appStore = useAppStore();
        appStore.startLoading();
        try {
          const url = `${baseUrl}/user/${this.user!._id}`;
          const response = await axios.get(url);
          this.user = response.data as User;
        } catch (error) {
          console.error(error);
        } finally {
          appStore.stopLoading();
        }
      },
      ratingsAvg (ratings: number[] ) {
        const rate = ref(0);
        if (ratings.length > 0) {
          rate.value =
            (ratings.reduce((a, b) => a + b, 0) / ratings.length);
          return rate.value;
        } else {
          return;
        }
      },
      async updateUser(user: User) {
        const appStore = useAppStore();
        appStore.startLoading();
        try {
          const url = `${baseUrl}/user/${this.user!._id}`;
          const response = await axios.put(
            url,
            user
          );
          const { updatedUser } = response.data as { updatedUser: User };
          const status = response.status;
          console.log("Risposta dal server:", {
            status,
            message: response.statusText,
          });
          appStore.showToast(response.data.message);
          this.user = updatedUser;
        } catch (error: any) {
          console.error("Errore durante l'aggiornamento:", error);
          appStore.showToast(error.response.data.message);
          throw error;
        } finally {
          appStore.stopLoading();
        }
      },
      async deleteUser() {
        const appStore = useAppStore();
        appStore.startLoading();
        try {
          const url = `${baseUrl}/user`;
          const response = await axios.delete(
            url,
            {
              params: {
                _id: this.user!._id,
              },
            }
          );
          const status = response.status;
          console.log("Risposta dal server:", {
            status,
            message: response.statusText,
          });
          this.resetUser();
          appStore.showToast(response.data.message);
      } catch (error: any) {
          console.error("Errore durante la cancellazione:", error);
          appStore.showToast(error.response.data.message);
          throw error;
        } finally {
          appStore.stopLoading();
        }
      },
      resetUser() {
        this.isLoggedIn = false;
        this.user = null;
        localStorage.clear();
      },
  },
    persist: true,
  }
);
