<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAppStore } from "./frontEnd/stores/appStore";
import { useUserStore } from "./frontEnd/stores/userStore";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";

const appStore = useAppStore();
const socket = appStore.socket;
const userStore = useUserStore();

onMounted(() => {
  if (userStore.user) {
    socket.emit("registerUser", userStore.user._id);
  }
});

onUnmounted(() => {
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