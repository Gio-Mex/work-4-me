import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "../interfaces/user";

import { toast } from "../components/ui/toast";

const baseUrl = import.meta.env.VITE_BASE_URL;
const port = import.meta.env.VITE_PORT;
const url = `${baseUrl}:${port}`;
console.log(url);


const showToast = (description: string, variant: any, duration: number) => {
  toast({
    description: description,
    variant: variant,
    duration: duration,
  });
};

export const useUserStore = defineStore(
  "user",
  {
    state: () => ({
      user: null as User | null,
      isLoggedIn: false,
    }),
    actions: {
      async login(form : User) {
        try {
          const url = `${baseUrl}:${port}/user/login`;
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
          showToast(response.data.message, "default", 3000);
          this.user = user;
          localStorage.setItem("authToken", token);
          this.isLoggedIn = true;
        } catch (error: any) {
          console.error("Errore durante il login:", error);
          showToast(error.response.data.message, "destructive", 3000);
          throw error;
        }
      },
      async signup(form : User) {
        try {
          const url = `${baseUrl}:${port}/user/signup`;
          const response = await axios.post(
            url,
            form
          );
          console.log(
            "Risposta dal server:", {status: response.status, messaggio: response.statusText},
          );
      
          if (response.status === 201) {
            showToast("Account creato con successo", "success", 3000);
          }
        } catch (error : any) {
          console.error("Errore durante la registrazione:", error);
          showToast(error.response.data.message, "destructive", 3000);
        }
      },
      logout() {
        this.resetUser();
        showToast("Logout effettuato con successo", "default", 3000);
      },
      async fetchUser() {
        try {
          const url = `${baseUrl}:${port}/user/${this.user!._id}`;
          const response = await axios.get(url);
          this.user = response.data as User;
        } catch (error) {
          console.error(error);
        }
      },
      async updateUser(user: User) {
        try {
          const url = `${baseUrl}:${port}/user/${this.user!._id}`;
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
          showToast(response.data.message, "default", 3000);
          this.user = updatedUser;
        } catch (error: any) {
          console.error("Errore durante l'aggiornamento:", error);
          showToast(error.response.data.message, "destructive", 3000);
          throw error;
        }
      },
      async deleteUser() {
        try {
          const url = `${baseUrl}:${port}/user`;
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
          showToast(response.data.message, "default", 3000);
      } catch (error: any) {
          console.error("Errore durante la cancellazione:", error);
          showToast(error.response.data.message, "destructive", 3000);
          throw error;
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
