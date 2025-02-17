<script setup lang="ts">
import { reactive, ref, onBeforeMount, onMounted, onBeforeUnmount } from "vue";
import { useJobStore } from "../stores/jobStore";
import { useUserStore } from "../stores/userStore";
import { useRouter } from "vue-router";
import axios from "axios"
import { io } from "socket.io-client";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";

import type { Job } from "../interfaces/job";
import type { Offer } from "../interfaces/offer";
import type { Chat } from "../interfaces/chat";
import type { Message } from "../interfaces/message";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
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
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "../components/ui/number-field";
import { Progress } from "../components/ui/progress";

const userStore = useUserStore();
const jobStore = useJobStore();
const router = useRouter();
let job = reactive({} as Job);
const jobId = router.currentRoute.value.params.id as string;
let newOffer = reactive({} as Offer);
let selectedOffer = ref({} as Offer);
let formattedDate = ref("" as string);
let chat = reactive({} as Chat);
let message = ref({} as Message);
const wsUrl =import.meta.env.BASE_URL;
const socket = io(wsUrl, {
  transports: ["websocket"],
});
let qualityRate = ref(1);
let reliabilityRate = ref(1);
let workerQualityRate = ref(0);
let workerReliabilityRate = ref(0);
const mapOptions = ref({
  center: [0, 0],
  zoom: 15,
  isLoading:false,
  notFound:true
});
const tilesOptions = ref({
  name: "OpenStreetMap",
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});

const geocodeAddress = async () => {
  mapOptions.value.isLoading=true
  mapOptions.value.notFound=true
  const address = `${job.userDetails?.address}, ${job.userDetails?.city}`;
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = response.data;
    if (data.length !== 0) {
      
      console.log(data)
      mapOptions.value.center = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      mapOptions.value.isLoading = false
      mapOptions.value.notFound = false
    } else {
      mapOptions.value.isLoading = false
    }
  } catch (error) {
    console.error("Errore nella geocodifica:", error);
  }
};

const formatDate = (date: number | string) => {
  const dateObject = new Date(date);
  const time =
    dateObject.getHours().toString().padStart(2, "0") +
    ":" +
    dateObject.getMinutes().toString().padStart(2, "0");
  const todayDate = new Date();
  if (
    dateObject.toLocaleDateString("it-IT") ===
    todayDate.toLocaleDateString("it-IT")
  ) {
    return `Oggi, ${time}`;
  } else {
    return dateObject
      .toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\//g, "-");
  }
};

onBeforeMount(async () => {
  job = jobStore.jobs.find((job) => job._id === jobId) as Job;
  formattedDate.value = formatDate(job.date);

  if (job.status !== "Aperto" && job.status !== "Offerta") {
    const fetchedChat = await jobStore.fetchChat(job._id as string);

    if (fetchedChat) {
      Object.assign(chat, fetchedChat);
    } else {
      const newChatData = newChat();
      Object.assign(chat, newChatData);
      await jobStore.updateChat(chat);
    }
  }
   geocodeAddress();

});

onMounted(() => {
  socket.on("message", (message) => {
    chat.messages.push(message);
  });
  setInterval(() => {
  socket.emit("ping", "keep-alive");
}, 5000);
});

const qualityAvg = (offer: Offer) => {
  if (offer.workerRatings) {
    const qualityRatings = offer.workerRatings.quality as number[];
    workerQualityRate.value =
      (qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length) * 20;
    console.log(workerQualityRate.value);
    return workerQualityRate.value;
  } else {
    return;
  }
};

const reliabilityAvg = (offer: Offer) => {
  if (offer.workerRatings) {
    const reliabilityRatings = offer.workerRatings.reliability as number[];
    workerReliabilityRate.value =
      (reliabilityRatings.reduce((a, b) => a + b, 0) /
        reliabilityRatings.length) *
      20;
    return workerReliabilityRate.value;
  } else {
    return;
  }
};

const setOffer = async () => {
  const offer = (document.getElementById("price") as HTMLInputElement)
    .value as unknown as number;

  const workerRatings = userStore.user!.ratings;

  newOffer = {
    id: job.offers!.length + 1,
    workerId: userStore.user!._id,
    worker:
      userStore.user!.name + " " + userStore.user!.lastName.slice(0, 1) + ".",
    workerRatings,
    amount: offer,
    date: Date.now(),
  };

  job.offers!.push(newOffer);
  job.status = "Offerta";
  await jobStore.newOffer(job);
  router.push("/jobs");
};

const acceptOffer = async (id: number) => {
  job.status = "Accettato";
  job.workerId = job.offers!.find((offer) => offer.id === id)!.workerId;
  job.amount = job.offers!.find((offer) => offer.id === id)!.amount;
  await userStore.updateUser(job.workerId);
  await jobStore.updateJob(job).then(() => {
    router.push("/jobs");
  });
};

const newChat = () => {
  chat.jobId = job._id as string;
  chat.userId = job.userId as string;
  chat.workerId = job.workerId as string;
  chat.messages = [];
  return chat;
};

const sendMessage = async () => {
  const chatInput = document.getElementById("message") as HTMLInputElement;
  if (message.value.content.trim()) {
    const newMessage = {
      senderId: userStore.user!._id,
      content: chatInput.value,
      date: Date.now(),
    } as Message;
    socket.emit("message", newMessage);
    chat.messages.push(newMessage);
    await jobStore.updateChat(chat);
    message.value.content = "";
  }
};

const startJob = async () => {
  job.status = "In lavorazione";
  await jobStore.updateJob(job);
};

const closeJob = async () => {
  job.status = "Chiuso";
  await jobStore.updateJob(job);
  router.push("/jobs");
};

const setRate = async () => {
  qualityRate.value = (document.getElementById("quality") as HTMLInputElement)
    .value as unknown as number;
  reliabilityRate.value = (
    document.getElementById("reliability") as HTMLInputElement
  ).value as unknown as number;
  job.evaluated = true;
  await jobStore.updateJob(job);
  await jobStore.rateWorker(job.workerId!, {
    quality: [qualityRate.value],
    reliability: [reliabilityRate.value],
  });
  router.push("/jobs");
};

onBeforeUnmount(() => {
  socket.disconnect();
});
</script>

<template>
  <h1
    v-if="job.userId === userStore.user?._id"
    class="text-4xl font-normal text-center pt-24 mb-4"
  >
    La mia richiesta
  </h1>
  <h1 v-else class="text-4xl font-normal text-center pt-24 mb-4">
    Proposta di lavoro
  </h1>

  <Card class="mx-2 md:mx-6 lg:mx-auto mb-4 max-w-4xl px-1 md:px-4">
    <CardHeader>
      <CardDescription class="text-center text-lg font-normal">
        <h2>Dettagli richiesta</h2>
      </CardDescription>
    </CardHeader>
    <hr class="mb-6 md:mb-0 md:mt-4 w-3/4 mx-auto" />
    <CardContent>
      <div class="space-y-4">
        <div
          class="grid grid-cols-2 gap-4 bg-sky-50 p-4 md:p-5 rounded-md shadow-sm"
        >
          <div class="grid gap-2">
            <Label class="text-sky-900">Titolo</Label>
            <p class="font-normal text-sm">{{ job?.title }}</p>
          </div>
          <div class="grid gap-2">
            <Label class="text-sky-900">Data</Label>
            <p class="font-normal text-sm">{{ formattedDate }}</p>
          </div>
        </div>
        <div class="grid gap-2 bg-sky-50 p-4 md:p-5 rounded-md shadow-sm">
          <Label class="text-sky-900">Descrizione</Label>
          <p class="font-normal text-sm">{{ job?.description }}</p>
        </div>
        <div class="grid grid-cols-2 bg-sky-50 p-4 md:p-5 rounded-md shadow-sm">
          <div class="grid gap-2">
            <Label class="text-sky-900">Città</Label>
            <p class="font-normal text-sm opacity-80">
              {{ job?.userDetails?.city }}
            </p>
          </div>
          <div class="grid gap-2">
            <Label class="text-sky-900">Stato richiesta</Label>
            <p class="font-normal text-sm opacity-80">{{ job?.status }}</p>
          </div>
        </div>
        <div v-if="job.userId !== userStore.user?._id && job.status === 'Accettato'" class="grid bg-sky-50 gap-2 p-4 md:p-5 rounded-md shadow-sm">
            <Label class="text-sky-900">Indirizzo</Label>
            <p class="font-normal text-sm opacity-80">
              {{ job?.userDetails?.address }}
            </p>
          </div>
        <div class="w-full h-[200px] md:h-[400px] flex">
          <span v-if="mapOptions.isLoading" class="mx-auto my-auto text-sky-950">
            Ricerca indirizzo...🔍
           </span>
          <LMap v-if="!mapOptions.notFound" :zoom="mapOptions.zoom" :center="mapOptions.center" class="w-full h-400 z-0 rounded">            
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              :attribution="tilesOptions.attribution"
              :name="tilesOptions.name"
            />
          </LMap>
           <span v-else-if="!mapOptions.isLoading &&mapOptions.notFound" class="mx-auto my-auto text-sky-950">
            Indirizzo non trovato sulla mappa ❌
           </span>
        </div>
       <div v-if="!mapOptions.notFound">
          <p class="text-center text-xs text-sky-950 opacity-55">Questa posizione è approssimativa, l'indirizzo completo sarà visibile al Worker una volta accettata l'offerta. </p>
       </div>
        <div class="flex justify-center pt-4 gap-2">
          <Button
            v-if="
              job.userId === userStore.user?._id && job.offers?.length === 0
            "
            class="primary-btn my-auto mb-0"
            @click="$router.push(`/jobs/edit/${job._id}`)"
            >Modifica</Button
          >
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button
                v-if="
                  job.userId === userStore.user?._id &&
                  (job.status === 'Aperto' || job.status === 'Offerta')
                "
                class="my-auto mb-0 primary-btn text-red-500"
                >Elimina</Button
              >
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle class="text-sky-950"
                  >Confermi di voler eliminare questa
                  richiesta?</AlertDialogTitle
                >
                <AlertDialogDescription class="text-red-500">
                  Attenzione, questa azione è irreversibile!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter class="grid grid-cols-2 space-x-2">
                <AlertDialogCancel class="mt-0 primary-btn w-full"
                  >Annulla</AlertDialogCancel
                >
                <AlertDialogAction
                  @click="jobStore.deleteJob(jobId), router.replace('/jobs')"
                  class="bg-red-500 text-sky-950 hover:text-red-500 hover:bg-sky-950"
                  >Continua</AlertDialogAction
                >
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div>
          <p
            v-if="job.userId === userStore.user?._id"
            class="text-center text-xs italic text-sky-950 opacity-55"
          >
            <b>N.B.</b> Se <u>ricevi</u> un'offerta non puoi più modificare la
            tua richiesta, mentre se <u>accetti</u> un'offerta non puoi nemmeno
            più eliminarla.
          </p>
        </div>

        <CardDescription class="text-center text-lg font-normal pt-4">
          <h2>Dettagli proposte</h2>
          <hr class="mb-0 mt-4 w-3/4 mx-auto" />
        </CardDescription>
        <p
          v-if="job.offers?.length === 0 && job.userId === userStore.user?._id"
          class="text-center text-xs italic opacity-50 mt-4"
        >
          Le proposte dei Workers appariranno qui
        </p>
        <p
          v-else-if="job.offers?.length === 0 && job.userId !== userStore.user?._id"
          class="text-center text-xs italic opacity-50 mt-4"
        >
          Non ci sono ancora offerte, fai tu la prima proposta!
        </p>
        <div>
          <div v-if="job.offers!.length > 0">
            <Table class="text-xs sm:text-sm">
              <TableCaption
                v-if="
                  job.userId === userStore.user?._id &&
                  (job.status === 'Aperto' || job.status === 'Offerta')
                "
                >Queste sono le offerte ricevute dai Workers, scegli quella che
                ti sembra migliore.</TableCaption
              >
              <TableCaption
                v-if="
                  job.userId === userStore.user?._id &&
                  job.status !== 'Aperto' &&
                  job.status !== 'Offerta'
                "
                class="my-4"
                >Hai scelto la proposta di
                {{
                  job.offers?.find((offer) => offer.workerId === job.workerId)
                    ?.worker
                }}, puoi comunicare con il Worker attraverso la
                chat</TableCaption
              >
              <TableCaption
                v-if="
                  job.workerId === userStore.user?._id &&
                  (job.status === 'Aperto' || job.status === 'Offerta')
                "
                >Queste sono le offerte inviate dai Workers, incluse le
                tue.</TableCaption
              >
              <TableCaption
                v-if="
                  job.workerId === userStore.user?._id &&
                  job.status !== 'Aperto' &&
                  job.status !== 'Proposta'
                "
                class="mt-8"
                >La tua proposta è stata accettata, puoi comunicare con l'utente
                attraverso la chat</TableCaption
              >
              <TableHeader>
                <TableRow class="bg-sky-950 pointer-events-none">
                  <TableHead class="text-sky-200 rounded-tl md:text-center">
                    Data
                  </TableHead>
                  <TableHead class="text-sky-200 md:text-center">
                    Worker
                  </TableHead>
                  <TableHead class="text-sky-200 md:text-center">
                    Valutazioni
                  </TableHead>
                  <TableHead class="text-sky-200 rounded-tr md:text-center">
                    Offerta(€)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="offer in job.offers"
                  :key="offer.id"
                  @click="selectedOffer = offer"
                  class="md:text-center bg-sky-50"
                >
                  <TableCell>
                    {{ formatDate(offer.date) }}
                  </TableCell>
                  <TableCell>{{ offer.worker }}</TableCell>
                  <TableCell class="p-0 md:py-1 text-center">
                    <span>
                      Qualità
                      <Progress
                        :model-value="qualityAvg(offer) as unknown as number"
                        class="scale-50 bg-sky-200 w-full"
                      />
                    </span>

                    <span>
                      Affidabilità
                      <Progress
                        :model-value="reliabilityAvg(offer) as unknown as number"
                        class="scale-50 bg-sky-200"
                      />
                    </span>
                  </TableCell>
                  <TableCell
                    class="flex flex-col items-center justify-center gap-1 md:flex-row md:gap-4"
                  >
                    {{ offer.amount }}.00
                    <span
                      v-if="offer.workerId === job.workerId"
                      class="material-symbols-outlined scale-75"
                      >handshake</span
                    >
                    <Button
                      v-if="
                        userStore.user?._id === job.userId &&
                        (job.status === 'Aperto' || job.status === 'Offerta')
                      "
                      size="sm"
                      class="h-6 bg-sky-950 text-green-500"
                      @click="acceptOffer(offer.id as number)"
                    >
                      Ok
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div
            v-if="
              job.userId !== userStore.user?._id &&
              (job.status === 'Aperto' || job.status === 'Offerta')
            "
            class="flex flex-col items-center mt-4"
          >
            <Label for="price" class="text-sky-900 text-lg">Proposta (€)</Label>
            <div class="flex gap-2 mt-1">
              <Input
                class="font-normal text-lg text-end opacity-50 w-[60px] p-1"
                id="price"
                type="number"
                v-model="newOffer.amount"
                placeholder="0"
              ></Input>
              <span class="self-center text-lg font-normal opacity-50"
                >.00</span
              >
            </div>
            <Button
              v-if="job.offers && job.userId !== userStore.user?._id"
              :disabled="
                !newOffer.amount ||
                newOffer.amount <= 0 ||
                /[,.]/.test(newOffer.amount.toString())
              "
              class="mt-4 primary-btn"
              @click="setOffer"
              >Proponi</Button
            >
            <p
              v-if="job.status === 'Aperto' || job.status === 'Offerta'"
              class="text-center text-sky-900 italic text-xs opacity-90 my-4"
            >
              Inserisci una proposta di pagamento e inviala all'utente
            </p>
          </div>
          <div
            v-if="job.status !== 'Aperto' && job.status !== 'Offerta'"
            class="mt-10"
          >
            <div
              class="flex align-center bg-sky-950 text-sky-100 rounded-t-md shadow-sm p-3 mx-auto mb-0"
            >
              <div
                v-if="
                  job.workerDetails?.avatar &&
                  job.userId === userStore.user?._id
                "
                class="flex items-center gap-3"
              >
                <Avatar class="avatar !w-12 !h-12 mx-auto">
                  <AvatarImage
                    v-if="job.workerDetails?.avatar"
                    :src="job.workerDetails?.avatar.toString()"
                    alt="Avatar"
                  />
                  <AvatarFallback class="content">
                    {{ job.workerDetails?.avatar }}
                  </AvatarFallback>
                </Avatar>
                <span class="text-lg">{{ job.workerDetails?.name }} </span>
              </div>
              <div v-else class="flex items-center gap-3">
                <Avatar class="avatar !w-12 !h-12 mx-auto">
                  <AvatarImage
                    v-if="job.userDetails?.avatar"
                    :src="job.userDetails?.avatar.toString()"
                  >
                    {{ job.userDetails?.avatar }}</AvatarImage
                  >
                  <AvatarFallback class="content">
                    {{ job.userDetails?.avatar }}
                  </AvatarFallback>
                </Avatar>
                <span class="text-lg">{{ job.userDetails?.name }}</span>
              </div>
            </div>
            <div
              class="h-[250px] md:h-[350px] bg-sky-50 flex flex-col rounded-t-md shadow-sm mx-auto gap-3 p-3 overflow-scroll"
            >
              <p
                v-for="message in chat.messages"
                :key="message._id"
                class="max-w-60 min-w-[120px] md:max-w-96 flex flex-col p-2 shadow rounded-xl text-xs md:text-sm break-words whitespace-normal gap-1"
                :class="
                  message.senderId === userStore.user?._id
                    ? 'self-end bg-sky-200 rounded-br-none'
                    : 'self-start bg-white rounded-bl-none'
                "
              >
                {{ message.content }}
                <span class="text-xs opacity-30 ms-auto mt-auto">{{
                  formatDate(message.date)
                }}</span>
              </p>
            </div>
            <div
              v-if="job.status !== 'Chiuso'"
              class="flex align-center bg-sky-950 rounded-b-md shadow-sm p-3 gap-2 mx-auto"
            >
              <Input
                class="rounded-3xl bg-white"
                id="message"
                v-model="message.content"
                placeholder="Scrivi un messaggio"
                @keydown.enter="sendMessage"
              >
              </Input>
              <Button
                v-if="message.content !== ''"
                class="rounded-full bg-sky-300 p-5"
                size="icon"
                @click="sendMessage()"
              >
                <span class="material-symbols-outlined scale-90"
                  >send</span
                ></Button
              >
            </div>
            <div
              v-if="
                job.status === 'Accettato' || job.status === 'In lavorazione'
              "
              class="flex flex-col items-center mt-10 text-center text-sm text-opacity-60 text-sky-950"
            >
              <p
                v-if="
                  job.workerId === userStore.user?._id &&
                  job.status !== 'In lavorazione'
                "
              >
                Passa alla fase di lavorazione per ottenere il
              </p>
              <p
                v-if="
                  job.workerId === userStore.user?._id &&
                  (job.status === 'Accettato' ||
                    job.status === 'In lavorazione')
                "
              >
                <b>JOB CODE</b> da presentare a
                {{ job.userDetails?.name }}
              </p>
              <Button
                v-if="
                  job.workerId === userStore.user?._id &&
                  job.status !== 'In lavorazione'
                "
                @click="startJob()"
                class="primary-btn my-6"
              >
                Inizia lavoro
              </Button>
              <p
                v-if="
                  job.userId === userStore.user?._id &&
                  job.status === 'In lavorazione'
                "
              >
                Se visualizzi questo <b>JOB CODE</b> significa che il Worker si
                è attivato per svolgere il lavoro.
                <br />
                Al suo arrivo assicurati che ne sia in possesso anche lui.
              </p>
              <p v-else v-if="job.userId === userStore.user?._id">
                Attendi che il Worker avvi il lavoro...
              </p>
              <p
                v-if="job.status === 'In lavorazione'"
                class="bold text-lg bg-sky-50 text-sky-950 rounded shadow-sm p-2 px-4 mt-4"
              >
                {{ job._id?.slice(-5).toUpperCase() }}
              </p>
              <p
                v-if="
                  job.workerId === userStore.user?._id &&
                  job.status === 'In lavorazione'
                "
                class="text-center text-sm text-sky-950 opacity-70 mt-8"
              >
                Quando avrai finito, termina il lavoro.<br />L'utente potrà così
                assegnarti un punteggio.
              </p>
              <Button
                v-if="
                  job.workerId === userStore.user?._id &&
                  job.status === 'In lavorazione'
                "
                @click="closeJob()"
                class="primary-btn my-6"
              >
                Termina lavoro
              </Button>
            </div>
          </div>
        </div>
        <div
          v-if="
            job.status === 'Chiuso' &&
            job.evaluated === false &&
            job.userId === userStore.user?._id
          "
        >
          <CardDescription class="text-center text-lg font-normal mt-4">
            <h2>Valutazione Worker</h2>
            <hr class="mb-0 mt-4 w-3/4 mx-auto" />
            <p class="text-center text-sm text-sky-950 opacity-70 mt-4">
              Il Worker ha segnalato la fine del lavoro. Cosa ne pensi di
              {{ job.workerDetails?.name }}?
            </p>
          </CardDescription>
          <div
            class="flex flex-col md:flex-row justify-center items-center mt-2"
          >
            <div class="grid grid-rows-2 gap-1 mt-2">
              <NumberField id="quality" :min="1" :max="5" :default-value="1">
                <Label for="quality" class="text-center text-sky-950"
                  >Qualità</Label
                >
                <NumberFieldContent class="max-w-[150px] mx-auto">
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
              <p class="text-center text-xs text-sky-950 opacity-70">
                Questa skill descrive la qualità del lavoro svolto, in relazione
                al compenso
              </p>
            </div>
            <div class="grid grid-rows-2 gap-1">
              <NumberField
                id="reliability"
                :min="1"
                :max="5"
                :default-value="1"
              >
                <Label for="reliability" class="text-center text-sky-950"
                  >Affidabilità</Label
                >
                <NumberFieldContent class="max-w-[150px] mx-auto">
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
              <p class="text-center text-xs text-sky-950 opacity-70">
                Questa skill descrive la puntualità e il rispetto verso gli
                accordi presi
              </p>
            </div>
          </div>
          <Button @click="setRate" class="primary-btn !mt-0 mx-auto block"
            >Valuta</Button
          >
          <p class="text-center text-sm italic text-sky-950 opacity-70 mt-4">
            <b>N.B.</b> <Link></Link>Le valutazioni non potranno essere
            modificate. <br />
            Indica valutazioni coerenti, poiché incideranno sulla scelta del
            Worker da parte degli altri utenti.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
  <div class="flex">
    <Button
      @click="router.push('/jobs')"
      class="primary-btn mt-4 mb-14 md:mb-12 mx-auto"
      >Indietro</Button
    >
  </div>
</template>
