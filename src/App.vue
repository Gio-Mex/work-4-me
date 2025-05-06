<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { jwtDecode } from "jwt-decode";
import type { Job } from "./frontEnd/interfaces/job";
import { useAppStore } from "./frontEnd/stores/appStore";
import { useJobStore } from "./frontEnd/stores/jobStore";
import { useUserStore } from "./frontEnd/stores/userStore";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";
import router from "./frontEnd/router";

const appStore = useAppStore();
const jobStore = useJobStore();
const userStore = useUserStore();
const socket = appStore.socket;
let tokenCheckInterval: any;

// Check if token is expired
const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  const decodedToken = jwtDecode(token);
  if (!decodedToken || !decodedToken.exp) {
    console.error("AuthToken non valido");
    return true;
  }
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
};

onMounted(() => {
  // AuthToken validity check every 15 minutes
  tokenCheckInterval = setInterval(() => {
    const currentToken = localStorage.getItem("authToken");
    if (currentToken && isTokenExpired(currentToken)) {
      localStorage.removeItem("authToken");
      userStore.isLoggedIn = false;
      router.push("/user/login");
    }
  }, 900000);

  if (!socket) {
    console.warn("⚠️ Socket not initialized!");
    return;
  }

  // Listen for authentication result
  socket.on("authenticated", (data) => {
    console.log("✅ Socket authenticated:", data);
  });
  socket.on("unauthorized", (data) => {
    console.warn("❌ Socket unauthorized:", data);
  });

  // Listen for jobNotification event
  socket.on("jobNotification", (job) => {
    jobStore.notifications.push(job._id);
  });

  // Listen for deleteNotifications event
  socket.on("deleteNotifications", async (job: Job) => {
    await appStore.deleteAllNotifications(job);
  });

  // Listen for disconnect event
  socket.on("disconnect", () => {
    if (userStore.user) {
      console.log("Socket disconnected");
    }
  });
});

onUnmounted(() => {
  clearInterval(tokenCheckInterval);
  socket.off("jobNotification");
  socket.off("deleteNotifications");
  socket.disconnect();
});
</script>

<template>
  <header>
    <Navbar />
  </header>
  <main>
    <RouterView />
    <Toaster />
  </main>
</template>
