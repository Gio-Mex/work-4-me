import { defineStore } from "pinia";
import { toast } from "../components/ui/toast";

export const useAppStore = defineStore("app", {
  state: () => ({
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