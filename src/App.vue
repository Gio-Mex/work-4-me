<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAppStore } from "./frontEnd/stores/appStore";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";

const appStore = useAppStore();
const socket = appStore.socket;

onMounted(() => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized!");
    return;
  }

  console.log("✅ Socket connected, listening for jobUpdated events");

  socket.on("jobUpdated", (data) => {
    console.log("📩 Job update received:", data);
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
