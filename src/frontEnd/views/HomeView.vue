<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { useAppStore } from "../stores/appStore";
import StepList from "../components/StepList.vue";

import { Button } from "../components/ui/button";

const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();
const currentImage = ref(0);
const imageLoaded = ref(true);
const workerQualityRate = ref(0);
const workerReliabilityRate = ref(0);

// Hero images
const heroImgs = Object.values(
  import.meta.glob<{ default: string }>("@/frontEnd/assets/img/hero/*.jpg", {
    eager: true,
  })
).map((img) => img.default);

// Show hero images function
const showImg = () => {
  setInterval(() => {
    imageLoaded.value = false;
    setTimeout(() => {
      currentImage.value = (currentImage.value + 1) % heroImgs.length;
      imageLoaded.value = true;
    }, 800);
  }, 3200);
};

// Create steps function
const createSteps = (
  stepsData: Array<{ title: string; description: string; icon: string }>
) =>
  stepsData.map((step, index) => ({
    step: index + 1,
    selected: index === 0,
    ...step,
  }));

// Homepage user steps
const userSteps = reactive(
  createSteps([
    { title: "Registrati", description: "Crea un account", icon: "person" },
    {
      title: "Richiedi",
      description: "Fai la tua richiesta",
      icon: "work",
    },
    {
      title: "Scegli",
      description: "Scegli la proposta migliore",
      icon: "handshake",
    },
    {
      title: "Verifica",
      description: "All'arrivo verifica il JOB CODE",
      icon: "pin",
    },
    {
      title: "Valuta",
      description: "Valuta il Worker",
      icon: "thumbs_up_down",
    },
  ])
);

// Homepage worker steps
const workerSteps = reactive(
  createSteps([
    { title: "Cerca", description: "Scegli la richiesta adatta", icon: "list" },
    {
      title: "Proponi",
      description: "Inserisci un compenso",
      icon: "euro_symbol",
    },
    {
      title: "Prendi accordi",
      description: "Accordati con l'utente",
      icon: "handshake",
    },
    { title: "Verifica", description: "Verifica il JOB CODE", icon: "pin" },
    { title: "Completa", description: "Completa il lavoro", icon: "task_alt" },
  ])
);

// Select step function
const selectStep = (steps: typeof userSteps, step: number) => {
  const selectedStep = steps.find((s) => s.step === step);
  if (selectedStep) {
    steps.forEach((s) => (s.selected = false));
    selectedStep.selected = true;
  }
};

// Call to action function
const goToNextPage = () => {
  router.push(userStore.user === null ? "/user/signup" : "/jobs");
};

onMounted(async () => {
  showImg();
  // Fetch user data
  if (userStore.user) {
    await userStore.fetchRatings();
    if (userStore.user.ratings) {
      workerQualityRate.value = Number(
        userStore
          .ratingsAvg(userStore.user.ratings.quality as number[])
          ?.toFixed(1)
      );
      workerReliabilityRate.value = Number(
        userStore
          .ratingsAvg(userStore.user.ratings.reliability as number[])
          ?.toFixed(1)
      );
    }
  }
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
      >Questa piattaforma si avvale di servizi basilari di terze parti.<br />Dopo
      un lungo periodo di inattività le performance potrebbero variare.</span
    >
  </div>
  <!-- Hero section -->
  <div v-else class="flex flex-row">
    <div
      class="relative w-full h-[300px] md:h-[450px] xl:h-[800px] overflow-hidden mt-20 md:mt-24 mb-4"
    >
      <div
        class="absolute w-full h-full opacity-75 bg-gradient-to-r from-sky-100 via-sky-100 to-transparent z-10"
      ></div>
      <div
        class="absolute top-0 xl:top-[15%] left-0 w-1/2 ps-4 mt-6 md:mt-10 flex flex-col gap-4 md:my-auto z-10"
      >
        <h1 class="text-5xl md:text-7xl text-sky-500 font-semibold">Work</h1>
        <span
          class="text-6xl md:text-8xl text-sky-700 font-semibold scale-125 ms-6 md:ms-16 lg:ms-28 xl:ms-80"
          >4</span
        >
        <h1
          class="text-6xl md:text-8xl text-sky-950 font-semibold scale-150 self-center mt-4"
        >
          Me
        </h1>
      </div>
      <div class="absolute w-3/4 h-full top-0 right-0 md:mt-0 overflow-hidden">
        <img
          :src="heroImgs[currentImage]"
          class="w-full h-full object-cover opacity-0 transition-all duration-1000 ease-in-out"
          :class="{ 'opacity-100': imageLoaded }"
        />
      </div>
    </div>
  </div>
  <!-- Worker rating section -->
  <div
    v-if="userStore.user?.isWorker"
    class="md:w-10/12 xl:w-8/12 p-5 my-6 mx-auto bg-sky-50 text-center shadow rounded"
  >
    <h2 class="text-2xl md:text-3xl font-semibold">
      {{ userStore.user?.name }}, questo è il tuo punteggio da Worker!
    </h2>
    <div
      v-if="
        userStore.user?.ratings?.quality.length > 0 &&
        userStore.user?.ratings?.reliability.length > 0
      "
      class="grid grid-cols-2 mt-4 md:mt-6"
    >
      <div>
        <p class="md:text-xl font-medium text-sky-950">Qualità</p>

        <section class="my-2">
          <span class="text-5xl text-sky-400 font-bold">{{
            workerQualityRate
          }}</span>
          <span class="text-3xl text-sky-900 font-semibold">/5</span>
        </section>
      </div>

      <div>
        <p class="md:text-xl font-medium text-sky-950">Affidabilità</p>
        <section class="my-2">
          <span class="text-5xl text-sky-400 font-bold"
            >{{ workerReliabilityRate }}
          </span>
          <span class="text-3xl text-sky-900 font-semibold">/5</span>
        </section>
      </div>
    </div>
    <div v-else>
      <p class="md:text-xl text-sky-950 text-center italic opacity-60 mt-3">
        Inizierai a vedere il punteggio dopo le prime valutazioni lasciate dagli
        utenti.
      </p>
    </div>
  </div>

  <hr class="mt-12 mb-4 md:mt-14 md:mb-10 w-3/5 mx-auto border-sky-400" />
  <div class="md:grid grid-cols-2">
    <!-- Why Work4Me section -->
    <div class="p-5 md:p-8 mt-4">
      <h2 class="text-2xl font-semibold mb-4">Perché Work4Me?</h2>
      <p class="md:text-lg">
        <span class="text-sky-400 font-semibold text-lg md:text-xl">W4M</span> è
        una piattaforma che cerca di mettere in contatto chi ha bisogno di aiuto
        in casa, con chi è in grado di dare quell'aiuto. Che sia un lavoro
        pianificato o un bisogno urgente, prova a fare la tua richiesta, così
        che sarà visibile agli altri utenti 🤗.
      </p>
    </div>
    <!-- What type of help section -->
    <div class="p-5 md:p-8 mt-4 bg-sky-50">
      <h2 class="text-2xl font-semibold mb-4">Che tipo di aiuto?</h2>
      <p class="md:text-lg">
        <span class="text-sky-400 font-semibold text-lg md:text-xl"
          >Qualsiasi</span
        >
        lavoro si possa svolgere in casa: preparare una cena per gli ospiti o
        riparare un tubo che perde acqua, cambiare una serratura o saldare una
        ringhiera, restaurare un bel mobile o configurare uno smartphone, fare
        la piega ai pantaloni o la messa in piega ai capelli 😁.
      </p>
    </div>
  </div>
  <!-- How it works section -->
  <div class="p-5 md:p-8 md:mt-8 text-center">
    <h2 class="text-2xl font-semibold">Come funziona Work4Me?</h2>
    <p class="md:text-lg mt-3">
      <span class="text-sky-400 font-semibold text-lg md:text-xl">Facile!</span>
      Consulta i seguenti passi.
    </p>
    <!-- Step list -->
    <StepList
      :steps="userSteps"
      :selectStep="(step : number) => selectStep(userSteps, step)"
    />
  </div>

  <hr class="mt-7 mb-11 md:mt-3 md:mb-14 w-3/5 mx-auto border-sky-400" />
  <!-- Become a worker section -->
  <div class="relative md:h-[400px] overflow-hidden my-6">
    <div class="absolute w-full h-full bg-sky-950 opacity-75"></div>
    <h2
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl lg:text-6xl font-semibold text-white text-center"
    >
      Diventa un Worker
    </h2>

    <img
      src="../assets/img/home-content-img.jpg"
      class="w-full h-full object-cover"
      alt="Shake hands"
    />
  </div>
  <div class="md:grid grid-cols-2 md:mt-8">
    <!-- What is a worker section -->
    <div class="p-5 md:p-8 mt-4 bg-sky-50">
      <h2 class="text-2xl font-semibold mb-4">Cos'è un Worker?</h2>
      <p class="md:text-lg">
        <span class="text-sky-400 font-semibold text-lg md:text-xl"
          >Semplicemente</span
        >
        potresti esserlo anche tu! <br />
        Se hai delle abilità particolari da mettere a disposizione degli altri,
        allora puoi diventare un Worker. Ti basterà andare sul tuo account,
        attivare la funzionalità e selezionare le tue abilità 💪.
      </p>
    </div>
    <!-- Can a worker make money section -->
    <div class="p-5 md:p-8 mt-4">
      <h2 class="text-2xl font-semibold mb-4">Posso guadagnare come Worker?</h2>
      <p class="md:text-lg">
        <span class="text-sky-400 font-semibold text-lg md:text-xl">Certo</span
        >, quando trovi una richiesta di lavoro che ti piace, prova a fare una
        proposta per il tuo compenso in base alle tue abilità. Se lavorerai bene
        potrai ottenere ottime valutazioni e aumentare le possibilità che le tue
        offerte siano accettate per lavori successivi 😎.
      </p>
    </div>
  </div>
  <!-- How a worker uses the platform section -->
  <div
    class="p-5 md:p-8 mt-6 mb-12 md:mb-0 text-center"
    :class="userStore.user !== null ? 'mb-12' : 'mb-4'"
  >
    <h2 class="text-2xl font-semibold">Come usa la piattaforma un Worker?</h2>
    <p class="md:text-lg mt-3">
      <span class="text-sky-400 font-semibold text-lg md:text-xl">Facile</span>
      anche questo. Consulta questi passi.
    </p>
    <!-- Step list -->
    <StepList
      :steps="workerSteps"
      :selectStep="(step : number) => selectStep(workerSteps, step)"
    />
  </div>

  <Button
    class="primary-btn w-auto p-10 my-8 text-lg md:text-2xl font-bold transition-all duration-250 ease-in-out flex mx-auto"
    @click="goToNextPage"
  >
    <span v-if="userStore.user === null">Mi hai convinto, iniziamo! 🚀</span>
    <span v-else>Vai alle richieste 📋</span>
  </Button>
</template>
