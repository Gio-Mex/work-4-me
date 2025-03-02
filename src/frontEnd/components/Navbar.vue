<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useJobStore } from "../stores/jobStore";
import { useUserStore } from "../stores/userStore";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const userStore = useUserStore();
const jobStore = useJobStore();
const router = useRouter();
const route = useRoute();
const windowWidth = ref(window.innerWidth);
const menuOpen = ref(false);

// Update window width function
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

// Close menu function
const closeMenuOnClickOutside = (event: Event) => {
  if (
    menuOpen.value &&
    !(event.target as HTMLElement).closest(".menu-container")
  ) {
    menuOpen.value = false;
  }
};

// Add event listeners
onMounted(() => {
  window.addEventListener("resize", updateWindowWidth);
  document.addEventListener("click", closeMenuOnClickOutside);
});

// Remove event listeners
onUnmounted(() => {
  window.removeEventListener("resize", updateWindowWidth);
  document.removeEventListener("click", closeMenuOnClickOutside);
});

// Toggle menu function
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

// Logout e redirect function
const logout = () => {
  userStore.logout();
  router.push("/");
};

// Navigation function
const navigateTo = (path: string) => {
  router.push(path);
  menuOpen.value = false;
};

// Menu links
const menuLinks = computed(() => [
  { id: 1, path: "/", icon: "home", label: "Home" },
  {
    id: 2,
    path: "/jobs",
    icon: "work",
    label: "Richieste",
    notifications: jobStore.notifications.length + (userStore.user!.notifications?.length || 0),
  },
  {
    id: 3,
    path: "/user",
    src: `${userStore.user?.avatar?.toString()}`,
    label: "Account",
  },
]);
</script>

<template>
  <div
    class="w-full fixed flex items-center justify-between p-2 pb-3 md:pt-3.5 md:pb-4 px-4 text-sky-950 bg-white z-50"
  >
    <!-- Logo -->
    <a class="flex items-center">
      <img
        src="../assets/img/logo.png"
        class="!mr-0 h-14 md:h-16 cursor-pointer"
        alt="Logo"
        @click="navigateTo('/')"
      />
    </a>

    <!-- Mobile hamburger icon -->
    <div
      v-if="windowWidth < 768"
      class="relative flex flex-col gap-1 cursor-pointer w-8 h-8 z-50 mt-4"
      @click="toggleMenu"
    >
      <span
      v-if="jobStore.notifications.length > 0 || (userStore.user?.notifications && userStore.user.notifications.length > 0) && userStore.isLoggedIn"
        class="h-4 w-4 absolute top-0 right-0 -translate-y-2.5 translate-x-2 bg-red-500 text-white rounded-full text-[10px] flex justify-center items-center z-30 transition-all duration-300 ease-in-out"
        :class="{ '!opacity-0': menuOpen }"
        >{{ jobStore.notifications.length }} + {{ userStore.user?.notifications.length }}</span
      >
      <span
        class="menu-bar bg-sky-200"
        :class="{ 'rotate-45 translate-y-2 bg-sky-400': menuOpen }"
      ></span>
      <span
        class="menu-bar bg-sky-400"
        :class="{ 'opacity-0': menuOpen }"
      ></span>
      <span
        class="menu-bar bg-sky-950"
        :class="{ '-rotate-45 -translate-y-2': menuOpen }"
      ></span>
    </div>

    <!-- Desktop menu -->
    <div v-if="windowWidth >= 768" class="ml-10 flex items-baseline space-x-4">
      <template v-if="userStore.isLoggedIn">
        <section class="flex flex-wrap gap-6">
          <a
            v-for="link in menuLinks"
            :key="link.path"
            class="relative flex flex-col text-xs text-center font-medium cursor-pointer hover:text-sky-700"
            :class="{ 'text-sky-500 font-bold': route.path === link.path }"
            @click="navigateTo(link.path)"
          >
            <span v-if="link.icon" class="material-symbols-outlined mx-auto">{{
              link.icon
            }}</span>
            <span
            v-if="link.notifications?? 0 > 0"
              class="h-4 w-4 absolute top-0 right-0 -translate-y-1 bg-red-500 text-white rounded-full text-[10px] flex justify-center items-center"
              >{{ link.notifications }}</span
            >
            <Avatar v-if="link.src" class="avatar !w-6 !h-6 mx-auto">
              <AvatarImage
                :src="userStore.user!.avatar?.toString()"
                alt="Avatar"
              />
              <AvatarFallback class="content !text-[0.6rem]">
                {{ userStore.user!.avatar }}
              </AvatarFallback>
            </Avatar>
            {{ link.label }}
          </a>
        </section>
        <span class="h-11 border border-sky-200 my-auto font-medium"></span>
        <a
          class="flex flex-col text-xs text-center font-medium cursor-pointer hover:text-sky-500"
          @click="logout"
        >
          <span class="material-symbols-outlined mx-auto">logout</span>
          Logout
        </a>
      </template>
      <template v-else>
        <a
          class="flex flex-col text-xs font-medium cursor-pointer hover:text-sky-500"
          @click="navigateTo('/user/login')"
        >
          <span class="material-symbols-outlined mx-auto">login</span> Accedi
        </a>
        <span class="h-8 border border-sky-200 mx-2 my-auto font-medium"></span>
        <a
          class="flex flex-col text-xs font-medium cursor-pointer"
          @click="navigateTo('/user/signup')"
        >
          <span class="material-symbols-outlined mx-auto hover:text-sky-500"
            >edit</span
          >
          Registrati
        </a>
      </template>
    </div>

    <!-- Mobile menu -->
    <div
      class="fixed top-0 -right-full w-full h-full bg-sky-900 bg-opacity-0 z-40 transition duration-300"
      @click.self="toggleMenu"
      :class="{ '!right-0 !bg-opacity-50': menuOpen === true }"
    >
      <div
        class="fixed h-full w-[150px] top-0 -right-full flex flex-col justify-between pt-20 pb-6 text-sky-950 bg-sky-50 opacity-0 z-50 transition-all duration-300 ease-in-out"
        :class="{ '!right-0 !opacity-100': menuOpen === true }"
      >
        <div
          v-if="userStore.isLoggedIn"
          class="h-full flex flex-col justify-between"
        >
          <div class="flex flex-col gap-4">
            <section v-for="link in menuLinks" :key="link.path">
              <a
                class="relative flex flex-col text-xs text-center font-medium cursor-pointer"
                @click="navigateTo(link.path)"
              >
                <span
                  v-if="link.icon"
                  class="material-symbols-outlined mx-auto"
                  >{{ link.icon }}</span
                >
                <span
                  v-if="link.notifications ?? 0 > 0"
                  class="h-4 w-4 absolute top-0 right-0 -translate-y-1 -translate-x-9 bg-red-500 text-white rounded-full text-[10px] flex justify-center items-center"
                  >{{ link.notifications }}</span
                >
                <Avatar v-if="link.src" class="avatar !w-6 !h-6 mx-auto">
                  <AvatarImage
                    :src="userStore.user!.avatar?.toString()"
                    alt="Avatar"
                  />
                  <AvatarFallback class="content !text-[0.6rem]">
                    {{ userStore.user!.avatar }}
                  </AvatarFallback>
                </Avatar>
                {{ link.label }}
              </a>
              <hr
                v-if="link.id !== menuLinks.length"
                class="border-1 border-sky-950 w-8/12 mx-auto mt-6"
              />
            </section>
          </div>

          <section>
            <a
              class="flex flex-col text-xs text-center font-medium cursor-pointer"
              @click="logout"
            >
              <span class="material-symbols-outlined mx-auto">logout</span>
              Logout
            </a>
          </section>
        </div>

        <div v-else class="flex flex-col items-center mt-4 gap-6">
          <a
            class="flex flex-col text-xs font-medium cursor-pointer"
            @click="navigateTo('/user/login')"
          >
            <span class="material-symbols-outlined mx-auto">login</span> Accedi
          </a>
          <hr class="border-1 border-sky-950 w-8/12" />
          <a
            class="flex flex-col text-xs font-medium cursor-pointer"
            @click="navigateTo('/user/signup')"
          >
            <span class="material-symbols-outlined mx-auto">edit</span>
            Registrati
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-bar {
  @apply w-8 h-1 rounded transition-all duration-300 ease-in-out;
}
</style>
