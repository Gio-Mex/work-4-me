<script setup lang="ts">
import { reactive, onBeforeMount } from "vue";
import router from "../router";
import { useJobStore } from "../stores/jobStore";
import { useUserStore } from "../stores/userStore";
import type { Job } from "../interfaces/job";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const userStore = useUserStore();
const jobStore = useJobStore();
const categories = jobStore.categories;
let form = reactive({} as any);
const jobId = router.currentRoute.value.params?.id;
let job = reactive( jobStore.jobs.find((job) => job._id === jobId) ?? {}) as Job;

onBeforeMount(() => {
  if (router.currentRoute.value.path.includes("edit")) {  
    if (job) {
      Object.assign(form, job);
    }
  } else {
    Object.assign(form, {
      category: "",
      title: "",
      description: "",
      offer: 0,
      date: Date.now(),
      userId: userStore.user!._id,
      status: "Aperto",
      notification: true,
      workerId: null,
    });
  }
});

const handleSubmit = async () => {
  if (router.currentRoute.value.path.includes("edit")) {
    await jobStore.updateJob(form).then(async() => {
      await jobStore.updateJobFromSocket(form).then(() => {
        router.replace({ path: "/jobs" });
      });
    });
    } else {
      console.log(form);
      await jobStore.createJob(form).then(async() => {
        await jobStore.updateJobFromSocket(form).then(() => {
          router.replace({ path: "/jobs" });
        });
      })
  }
};
</script>

<template>
  <h2 v-if ="router.currentRoute.value.path.includes('edit')" class="text-4xl font-normal text-center p-1 pt-24 mb-4">
    Modifica richiesta
  </h2>
  <h2 v-else class="text-4xl font-normal text-center p-1 pt-32 md:pt-28 mb-4">
    Nuova richiesta
  </h2>

  <form class="" @submit.prevent="handleSubmit">
    <Card class="mx-2 md:mx-4 lg:mx-auto mb-20 lg:mb-10 max-w-4xl">
      <CardHeader class="text-center">
        <CardDescription class="text-center text-lg font-normal">
          <h1 v-if="router.currentRoute.value.path.includes('edit')" >Modifica i dati della richiesta</h1>
          <h1 v-else>Inserisci i dati della richiesta</h1></CardDescription>
      </CardHeader>
      <hr class="mb-6 md:mb-0 md:mt-4 w-3/4 mx-auto">
      <CardContent>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="categories"
            class="text-sky-950"
              >Categoria
              <span v-if="!form.category" class="text-red-500">*</span>
            </Label>
            <Select id="categories" v-model="form.category" required>
              <SelectTrigger class="w-[240px]">
                <SelectValue placeholder="Seleziona una categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categorie</SelectLabel>
                  <SelectItem
                    v-for="category in categories"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="!form.category" class="text-red-500 text-xs">
              Questo campo è obbligatorio.
            </p>
          </div>
          <div class="grid gap-2">
            <Label for="title"
            class="text-sky-950"
              >Titolo
              <span v-if="!form.title" class="text-red-500">*</span></Label
            >
            <Input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="Titolo del lavoro"
              required
            />
            <p v-if="!form.title" class="text-red-500 text-xs">
              Questo campo è obbligatorio.
            </p>
          </div>
          <div class="grid gap-2">
            <Label for="description"
            class="text-sky-950"
              >Descrizione
              <span v-if="!form.description" class="text-red-500"
                >*</span
              ></Label
            >
            <Textarea
              id="description"
              v-model="form.description"
              type="text"
              placeholder="Descrizione del lavoro"
              required
            />
            <p v-if="!form.description" class="text-red-500 text-xs">
              Questo campo è obbligatorio.
            </p>
          </div>
          <p class="text-xs italic text-center text-sky-950 opacity-70">Cerca di essere specifico nella tua richiesta così che il Worker possa capire di cosa hai bisogno.</p>
        </div>
        <div class="flex justify-center gap-4">
          <Button @click="router.replace('/jobs')" class="mt-4 primary-btn hover:!text-red-500" type="reset">Annulla</Button>
          <Button class="mt-4 primary-btn hover:!text-green-500" type="submit">Invia</Button>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
