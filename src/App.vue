<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAppStore } from "./frontEnd/stores/appStore";
import { useJobStore } from "./frontEnd/stores/jobStore";
import { useUserStore } from "./frontEnd/stores/userStore";
import { jwtDecode } from "jwt-decode";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";

const appStore = useAppStore();
const jobStore = useJobStore();
const userStore = useUserStore();
const socket = appStore.socket;
let tokenCheckInterval: any;

const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  const decodedToken = jwtDecode(token);
  if (!decodedToken || !decodedToken.exp) {
    console.error("AuthToken non valido");
    return true;
  }
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
}

onMounted(() => {
  // Controlla il token ogni 30 secondi
  tokenCheckInterval = setInterval(() => {
    const currentToken = localStorage.getItem("authToken");
    if (currentToken && isTokenExpired(currentToken)) {
      localStorage.removeItem("authToken");
      window.location.href = "/user/login";
    }
  }, 15000); // Ogni 30 secondi

  if (!socket) {
    console.warn("⚠️ Socket not initialized!");
    return;
  }

  console.log("✅ Socket connected, listening for events");

  if (userStore.user) {
    socket.emit("registerUser", userStore.user._id);
  }

  socket.on("jobNotification", (data) => {
    console.log("📩 New job notification:", data);
    jobStore.notifications.push(data._id);
  });

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
