<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
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

// Parse JWT
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// Schedule authToken expiration
const scheduleTokenExpiration = (token: string) => {
  const decoded = parseJwt(token);
  if (!decoded?.exp) return;

  const expTime = decoded.exp * 1000;
  const now = Date.now();
  const timeout = expTime - now;

  if (timeout > 0) {
    setTimeout(() => {
      localStorage.removeItem("authToken");
      userStore.isLoggedIn = false;
      router.push("/user/login");
    }, timeout);
  } else {
    localStorage.removeItem("authToken");
    userStore.isLoggedIn = false;
    router.push("/user/login");
  }
}

onMounted(() => {
  // AuthToken validity check
  const currentToken = localStorage.getItem("authToken");
  if (currentToken) {
    scheduleTokenExpiration(currentToken);
  }

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
