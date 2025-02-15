<script setup lang="ts">
import { RouterView } from "vue-router";

import Navbar from "./frontEnd/components/Navbar.vue";
import Toaster from "./frontEnd/components/ui/toast/Toaster.vue";
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

<style scoped></style>
