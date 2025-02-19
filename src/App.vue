<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { RouterView } from "vue-router";
import { useUserStore } from "./frontEnd/stores/userStore";
import { socket } from "./socket"; // Importiamo il singleton
import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";

const userStore = useUserStore();

onMounted(() => {
  watch(
    () => userStore.user,
    (newUser) => {
      if (newUser) {
        socket.connect(); // Connetti WebSocket solo dopo il login
        socket.emit("registerUser", newUser._id);
        console.log(`✅ Utente ${newUser._id} registrato nel WebSocket`);
      }
    },
    { immediate: true } // Esegui subito se l'utente è già loggato
  );

  socket.on("jobUpdated", (updatedJob) => {
    console.log("🔄 Aggiornamento ricevuto:", updatedJob);
  });
});

onUnmounted(() => {
  socket.disconnect();
  console.log("❌ WebSocket disconnesso");
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