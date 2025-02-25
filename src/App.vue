<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAppStore } from "./frontEnd/stores/appStore";
import { useJobStore } from "./frontEnd/stores/jobStore";
import { useUserStore } from "./frontEnd/stores/userStore";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";

const appStore = useAppStore();
const jobStore = useJobStore();
const userStore = useUserStore();
const socket = appStore.socket;

onMounted(() => {
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
        appStore.socket.emit("registerUser", userStore.user!._id);
      }, 3000);
    }
  });
});

onUnmounted(() => {
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
