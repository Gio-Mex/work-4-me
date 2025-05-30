<script setup lang="ts">
import { useJobStore } from "../stores/jobStore";
import { useUserStore } from "../stores/userStore";
import { useAppStore } from "../stores/appStore";
import { onMounted, watch, computed, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import type { Job } from "../interfaces/job";
// ---- ShadCn Components
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
// ----
const router = useRouter();
const jobStore = useJobStore();
const userStore = useUserStore();
const appStore = useAppStore();
const socket = appStore.socket;
const filteredJobs = ref(null as null | Job[]);

const archivedUrl = computed(() =>
  router.currentRoute.value.path.includes("archived")
);
let searchCity = ref("" as string);
let searchCategory = ref("" as string);

// Status details
const statusItems = [
  { name: "Aperto", icon: "pending" },
  { name: "Offerta", icon: "currency_exchange" },
  { name: "Accettato", icon: "handshake" },
  { name: "In corso", icon: "manufacturing" },
  { name: "Chiuso", icon: "task_alt" },
];

const statusContent = `
  <div class="text-[10px] flex gap-5 justify-center">
    ${statusItems
      .map(
        (item) => `
          <section class="flex flex-col">
            <span class="material-symbols-outlined scale-75">${item.icon}</span> ${item.name}
          </section>
        `
      )
      .join("")}
  </div>
`;

const accordionContent = {
  value: "Status",
  title: "Stato:",
  content: statusContent,
};

const hasNotifications = computed(() => {
  return (id: string) => {
    return (
      jobStore.notifications.includes(id) ||
      (userStore.user?.notifications?.includes(id) ?? false)
    );
  };
});

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
    if (filteredJobs.value !== null) {
      return filteredJobs.value;
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
  }
});

// Filter jobs function
const searchJobs = () => {
  const results = jobStore.jobs.filter(
    (job) =>
      job.userId !== userStore.user!._id &&
      job.category.includes(searchCategory.value) &&
      job.city.toLowerCase().includes(searchCity.value.toLowerCase()) &&
      (job.workerId === userStore.user?._id ||
        job.status === "Aperto" ||
        job.status === "Offerta")
  );
  filteredJobs.value = results;
};

const clearSearch = () => {
  searchCity.value = "";
  searchCategory.value = "";
  filteredJobs.value = null;
};

// Select request function (delete notification on store and database, and redirect to request or job page)
const selectRequest = async (job: Job) => {
  appStore.deleteAllNotifications(job);
  router.push(`/jobs/${job._id}`);
};

watch(
  () => router.currentRoute.value.path,
  async () => {
    await handleRouteChange();
  }
);

// Handle route change function (fetch active or archived jobs depending on the route)
const handleRouteChange = async () => {
  if (archivedUrl.value) {
    await jobStore.fetchArchivedJobs();
  } else {
    await jobStore.fetchActiveJobs();
  }
};

onMounted(async () => {
  await handleRouteChange();
  if (userStore.user) {
    socket.on("jobUpdated", async (job: Job) => {
      jobStore.updateJobStore(job);
    });
  }

  socket.on("deleteJob", async (jobId: string) => {
    jobStore.deleteJobFromStore(jobId);
  });

  socket.on("deleteUser", async (userId: string) => {
    jobStore.deleteAllStoreUserJobs(userId);
  });
});

onUnmounted(() => {
  appStore.socket.off("jobUpdated");
  appStore.socket.off("deleteJob");
  appStore.socket.off("deleteUser");
});
</script>

<template>
  <!-- Loader -->
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
    <div class="w-full md:max-w-2xl lg:w-1/2 p-2 md:p-4 mb-4 mt-20">
      <div class="mb-0 bg-sky-900 rounded-t border-b border-b-sky-200">
        <h2 class="text-4xl font-light text-center text-sky-200 p-3">
          Richieste
        </h2>
      </div>
      <!-- Requests table -->
      <Table v-if="reqsList && reqsList.length > 0" class="mt-0 table-fixed w-full">
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
                v-if="statusItems.find((item) => item.name === req.status)"
                class="material-symbols-outlined scale-110"
                :class="{ 'animate-pulse': hasNotifications(req._id!) }"
              >
                {{ statusItems.find((item) => item.name === req.status)?.icon }}
              </span>
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
        class="w-full rounded-sm mx-auto mt-6 text-sky-200 bg-sky-700 hover:bg-sky-900"
        ><span class="material-symbols-outlined">add</span>Inserisci nuova
        richiesta</Button
      >
    </div>

    <div
      v-if="userStore.user?.isWorker"
      class="w-full md:max-w-2xl lg:w-1/2 p-2 md:p-4 mb-4 lg:mt-20"
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
          <!-- Search bar -->
          <div class="flex flex-col md:flex-row gap-2 md:gap-0">
            <Input
              v-model="searchCity"
              type="text"
              placeholder="Luogo"
              class="md:w-4/12 h-9 md:rounded-e-none"
            />
            <Select id="categories" v-model="searchCategory">
              <SelectTrigger
                class="md:w-6/12 h-9 md:rounded-none focus:ring-0 focus:ring-offset-0"
              >
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categorie</SelectLabel>
                  <SelectItem
                    v-for="category in new Set(
                      jobsList.map((job) => job?.category)
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
                @click="searchJobs()"
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
        <!-- Jobs table -->
        <Table v-if="jobsList.length > 0" class="table-fixed w-full">
          <TableCaption
            class="text-xs text-sky-200 text-opacity-60 bg-sky-950 rounded-b mt-0"
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
                  v-if="statusItems.find((item) => item.name === job.status)"
                  class="material-symbols-outlined scale-110"
                  :class="{ 'animate-pulse': hasNotifications(job._id!) }"
                >
                  {{
                    statusItems.find((item) => item.name === job.status)?.icon
                  }}
                </span>
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
