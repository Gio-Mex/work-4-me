<script setup lang="ts">
import { useJobStore } from "../stores/jobStore";
import { useUserStore } from "../stores/userStore";
import { useAppStore } from "../stores/appStore";
import { onMounted, watch, computed, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import type { Job } from "../interfaces/job";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

const router = useRouter();
const jobStore = useJobStore();
const userStore = useUserStore();
const appStore = useAppStore();
const socket = appStore.socket;

const archivedUrl = computed(() =>
  router.currentRoute.value.path.includes("archived")
);
let searchCity = ref("" as string);
let searchCategory = ref("" as string);

const statusContent = `
    <div class="text-[10px] flex gap-5 justify-center">
      <section class="flex flex-col">
        <span class="material-symbols-outlined scale-75">pending</span> Aperto
      </section>
      <section class="flex flex-col">
        <span class="material-symbols-outlined scale-75">currency_exchange</span> Offerta
      </section>
      <section class="flex flex-col">
        <span class="material-symbols-outlined scale-75">handshake</span> Accettato
      </section>
      <section class="flex flex-col">
        <span class="material-symbols-outlined scale-75">manufacturing</span> In corso
      </section>
      <section class="flex flex-col">
        <span class="material-symbols-outlined scale-75">task_alt</span> Chiuso
      </section>
    </div>
  `;

const accordionContent = {
  value: "Status",
  title: "Stato:",
  content: statusContent,
};

const hasNotifications: (id: string) => boolean = (id) => {
  return (
    jobStore.notifications.filter((notificationId) => notificationId === id)
      .length > 0
  );
};

let reqsList = computed(() => {
  if (archivedUrl.value) {
    return jobStore.jobs.filter(
      (job: Job) => job.userId === userStore.user?._id && job.evaluated === true
    );
  } else {
    return jobStore.jobs.filter(
      (job: Job) =>
        job.userId === userStore.user?._id && job.evaluated === false
    );
  }
});

let jobsList = computed(() => {
  if (archivedUrl.value) {
    return jobStore.jobs.filter(
      (job: Job) =>
        job.workerId === userStore.user?._id && job.evaluated === true
    );
  } else {
    return jobStore.jobs.filter(
      (job: Job) =>
        ((userStore.user?.skills.includes(job.category) &&
          job.userId !== userStore.user?._id &&
          (job.status === "Aperto" || job.status === "Offerta")) ||
          job.workerId === userStore.user?._id) &&
        job.evaluated === false
    );
  }
});

const searchJobs: (job: Job) => void = (job: Job) => {
  () =>
    job.userId !== userStore.user!._id &&
    job.category.includes(searchCategory.value) &&
    userStore.user!.skills.includes(job.category) &&
    job.city
      .toLowerCase()
      .includes(searchCity.value.toLowerCase());
};

const clearSearch: () => void = () => {
  searchCity.value = "";
  searchCategory.value = "";
};

const selectRequest = async (job: Job) => {
  if (jobStore.notifications.includes(job._id!)) {
    jobStore.deleteNotification(job._id!);
  }
  router.push(`/jobs/${job._id}`);
};

watch(
  () => router.currentRoute.value.path,
  async () => {
    await handleRouteChange();
  }
);

const handleRouteChange = async () => {
  if (archivedUrl.value) {
    await jobStore.fetchArchivedJobs(userStore.user!._id);
  } else {
    await jobStore.fetchActiveJobs();
  }
};

onMounted(async () => {
  await handleRouteChange();
  console.log(jobStore.jobs);
  if (userStore.user) {
    console.log("🟢 Socket attivo?", socket.connected);

    socket.on("jobUpdated", async (job) => {
      console.log("📡 Ricevuto jobUpdated:", job);
      //await jobStore.updateJobStore(job);
      await jobStore.updateJob(job);
      //await jobStore.fetchActiveJobs();
    });
  }
});

onUnmounted(() => {
  appStore.socket.off("jobUpdated");
});
</script>

<template>
  <div
    v-if="appStore.isLoading"
    class="flex flex-col justify-center items-center h-96"
  >
    <div
      class="animate-spin rounded-full h-10 w-10 border-t-4 border-sky-800"
    ></div>
    <span class="text-sky-950 text-center mt-10 mx-3"
      >Questa piattaforma si avvale di servizi basilari di terze parti.<br />
      Dopo un lungo periodo di inattività le performance potrebbero
      variare.</span
    >
  </div>
  <div
    v-else
    class="flex flex-col lg:flex-row lg:justify-center items-center lg:items-start gap-6 lg:gap-1 xl:gap-20"
  >
    <div class="w-full md:max-w-2xl lg:w-1/2 p-2 md:p-4 mb-4 mt-20 md:mt-24">
      <div class="mb-0 bg-sky-900 rounded-t border-b border-b-sky-200">
        <h2 class="text-4xl font-light text-center text-sky-200 p-3">
          Richieste
        </h2>
      </div>
      <Table v-if="reqsList.length > 0" class="mt-0 table-fixed w-full">
        <TableCaption class="bg-sky-900 rounded-b mt-0">
          <Accordion
            type="single"
            class="text-sky-200 text-opacity-80"
            collapsible
          >
            <AccordionItem value="accordionContent" class="!text-xs border-0">
              <AccordionTrigger
                class="text-sky-200 mx-28 md:mx-64 lg:mx-44 xl:mx-64"
                >{{ accordionContent.title }}</AccordionTrigger
              >
              <AccordionContent v-html="accordionContent.content">
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TableCaption>
        <TableHeader>
          <TableRow class="bg-sky-900 pointer-events-none">
            <TableHead class="text-sky-200 text-center"> Categoria </TableHead>
            <TableHead class="text-sky-200 text-center">Titolo</TableHead>
            <TableHead class="text-sky-200 text-center"> Stato </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="bg-sky-50">
          <TableRow
            v-for="req in reqsList"
            :key="req._id"
            class="cursor-pointer"
            @click="selectRequest(req)"
          >
            <TableCell class="font-medium text-center">
              {{ req.category }}
            </TableCell>
            <TableCell class="text-center">{{ req.title }}</TableCell>
            <TableCell class="flex flex-row justify-around items-center">
              <span
                v-if="req.status === 'Aperto'"
                class="material-symbols-outlined scale-110"
                :class="{
                    'animate-pulse' : hasNotifications(req._id!),
                  }"
                >pending</span
              ><span
                v-if="req.status === 'Offerta'"
                class="material-symbols-outlined"
                :class="{
                    'animate-pulse' : hasNotifications(req._id!),
                  }"
                >currency_exchange</span
              ><span
                v-if="req.status === 'Accettato'"
                class="material-symbols-outlined scale-110"
                :class="{
                    'animate-pulse' : hasNotifications(req._id!),
                  }"
                >handshake</span
              ><span
                v-if="req.status === 'In lavorazione'"
                class="material-symbols-outlined scale-110"
                :class="{
                    'animate-pulse' : hasNotifications(req._id!),
                  }"
                >manufacturing</span
              ><span
                v-if="req.status === 'Chiuso'"
                class="material-symbols-outlined scale-110"
                :class="{
                    'animate-pulse' : hasNotifications(req._id!),
                  }"
                >task_alt</span
              >
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p v-else class="text-center font-light italic text-sm opacity-50 mt-4">
        Le tue richieste attive saranno visibili qui, dopo che le avrai valutate
        potrai trovarle nell'archivio del tuo account.
      </p>
      <Button
        @click="$router.push('/jobs/new')"
        class="w-full mx-auto mt-6 text-sky-200 bg-sky-700 hover:bg-sky-900"
        ><span class="material-symbols-outlined">add</span>Inserisci nuova
        richiesta</Button
      >
    </div>

    <div
      v-if="userStore.user?.isWorker"
      class="w-full md:max-w-2xl lg:w-1/2 p-2 md:p-4 mb-4 lg:mt-24"
    >
      <div class="mb-0 bg-sky-950 border-b border-b-sky-200 rounded-t">
        <h2
          class="text-4xl font-light text-center text-sky-200 p-3 border-b border-b-sky-200"
        >
          Lavori
        </h2>
        <div
          v-if="
            userStore.user?.skills.some((skill) =>
              jobStore.jobs.map((job) => job.category).includes(skill)
            )
          "
          class="flex flex-col px-3 md:px-5"
        >
          <h3 class="text-xl font-extralight text-center text-sky-200 my-3">
            Cerca un lavoro
          </h3>

          <div class="flex flex-col md:flex-row gap-2 md:gap-0">
            <Input
              v-model="searchCity"
              type="text"
              placeholder="Luogo"
              class="md:w-4/12 h-9 md:rounded-e-none focus:border-sky-600 focus:bg-sky-50 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Select id="categories" v-model="searchCategory">
              <SelectTrigger
                class="md:w-6/12 h-9 md:rounded-none focus:ring-0 focus:ring-offset-0 focus:border-sky-600 focus:bg-sky-50"
              >
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categorie</SelectLabel>
                  <SelectItem
                    v-for="category in new Set(
                      jobsList.map((job) => job.category)
                    )"
                    :key="category"
                    unique
                    :value="category"
                  >
                    {{ category }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <section class="flex gap-1.5 md:gap-0">
              <Button
                @click="searchJobs"
                class="w-1/2 mb-8 text-sky-200 bg-sky-700 hover:bg-sky-900 rounded-e-none md:rounded-none"
                ><span class="material-symbols-outlined">filter_list</span>
              </Button>
              <Button
                @click="clearSearch"
                class="w-1/2 mb-8 text-sky-200 bg-sky-700 hover:bg-sky-900 rounded-s-none"
                ><span class="material-symbols-outlined">filter_list_off</span>
              </Button>
            </section>
          </div>
        </div>
      </div>
      <div>
        <Table v-if="jobsList.length > 0" class="table-fixed w-full">
          <TableCaption
            class="text-xs text-sky-200 text-opacity-60 bg-sky-950 rounded-b p-3 mt-0"
            ><Accordion
              type="single"
              class="text-sky-200 text-opacity-80"
              collapsible
            >
              <AccordionItem value="accordionContent" class="!text-xs border-0">
                <AccordionTrigger
                  class="text-sky-200 mx-28 md:mx-64 lg:mx-44 xl:mx-64"
                  >{{ accordionContent.title }}</AccordionTrigger
                >
                <AccordionContent v-html="accordionContent.content">
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TableCaption>
          <TableHeader>
            <TableRow class="bg-sky-950 pointer-events-none">
              <TableHead class="text-sky-200 text-center"> Luogo </TableHead>
              <TableHead class="text-sky-200 text-center">Titolo</TableHead>
              <TableHead class="text-sky-200 text-center"> Stato </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="bg-sky-50">
            <TableRow
              v-for="job in jobsList"
              :key="job._id"
              class="cursor-pointer"
              @click="selectRequest(job)"
            >
              <TableCell class="font-medium text-center">
                {{ job.city }}
              </TableCell>
              <TableCell class="text-center">{{ job.title }}</TableCell>
              <TableCell class="flex flex-row justify-around items-center">
                <span
                  v-if="job.status === 'Aperto'"
                  class="material-symbols-outlined scale-110"
                  :class="{
                    'animate-pulse' : hasNotifications(job._id!),
                  }"
                  >pending</span
                ><span
                  v-if="job.status === 'Offerta'"
                  class="material-symbols-outlined"
                  :class="{
                    'animate-pulse' : hasNotifications(job._id!),
                  }"
                  >currency_exchange</span
                >
                <span
                  v-if="job.status === 'Accettato'"
                  class="material-symbols-outlined scale-110"
                  :class="{
                    'animate-pulse' : hasNotifications(job._id!),
                  }"
                  >handshake</span
                >
                <span
                  v-if="job.status === 'In lavorazione'"
                  class="material-symbols-outlined scale-110"
                  :class="{
                    'animate-pulse' : hasNotifications(job._id!),
                  }"
                  >manufacturing</span
                >
                <span
                  v-if="job.status === 'Chiuso'"
                  class="material-symbols-outlined scale-110"
                  :class="{
                    'animate-pulse' : hasNotifications(job._id!),
                  }"
                  >task_alt</span
                >
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <p v-else class="text-center font-light italic text-sm opacity-50 mt-4">
          I lavori più adatti alle tue abilità saranno visibili qui, se presenti
          nella piattaforma. Troverai i lavori completati e valutati dagli
          utenti nell'archivio del tuo account.
        </p>
      </div>
    </div>
  </div>
  <div class="flex">
    <Button
      v-if="archivedUrl"
      @click="router.push('/user')"
      class="primary-btn my-auto mt-4 mx-auto"
      >Indietro</Button
    >
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  @apply text-sky-500;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
