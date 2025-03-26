<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAppStore } from "./frontEnd/stores/appStore";
import { useJobStore } from "./frontEnd/stores/jobStore";
import { useUserStore } from "./frontEnd/stores/userStore";
import { jwtDecode } from "jwt-decode";

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
  console.log("✅ Socket connected, listening for events");

  // Listen for jobUpdated event
  socket.on("jobNotification", (job) => {
    // Check if the current route is /jobs to avoid duplicate notifications (this page fetches jobs and receives notifications from database)
    if (router.currentRoute.value.path === "/jobs") return;
    jobStore.notifications.push(job._id);
  });
  // Listen for disconnect event
  socket.on("disconnect", () => {
    if (userStore.user) {
      console.log("Socket disconnected! Attempting to reconnect...");
      setTimeout(() => {
        appStore.socket.emit("registerUser", userStore.user?._id);
      }, 3000);
    }
  });
});

onUnmounted(() => {
  clearInterval(tokenCheckInterval);
  socket.off("jobUpdated");
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
