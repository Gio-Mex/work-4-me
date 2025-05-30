<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import router from "../router";
import axios from "axios";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/vue";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { Gravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { useUserStore } from "../stores/userStore";
import { useJobStore } from "../stores/jobStore";
import type { User } from "../interfaces/user";
import { useNominatim } from "../composables/useNominatim";

// ---- ShadCn Components
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
// ----
const userStore = useUserStore();
const jobStore = useJobStore();
const skills = jobStore.categories;
const { cityQuery, suggestions, cityError, selectSuggestion, validateCity, suppressFetch } =
  useNominatim();

const form = reactive({
  name: userStore.user!.name,
  lastName: userStore.user!.lastName,
  address: userStore.user!.address,
  city: userStore.user!.city,
  province: userStore.user!.province,
  email: userStore.user!.email,
  avatar: userStore.user!.avatar,
  isWorker: userStore.user!.isWorker,
  skills: userStore.user!.skills,
}) as User;
suppressFetch.value = true;
cityQuery.value = form.city || "";

const avatarId = ref<string>("");
const isUploaded = ref<boolean>(true);
const uploadProgress = ref<number>(0);
// ---- Cloudinary details
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
});

const cldImg = computed(() => {
  if (!avatarId.value) return null;
  return cld
    .image(avatarId.value)
    .quality("auto")
    .format("auto")
    .resize(fill().width(120).height(120).gravity(Gravity.autoGravity()));
});
// ----

// Upload avatar handler
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    form.avatar = file;
    uploadOnCloudinary();
  }
};

// Upload avatar on cloudinary function
const uploadOnCloudinary = async () => {
  isUploaded.value = false;
  uploadProgress.value = 0;

  const formData = new FormData();
  formData.append("file", form.avatar);
  formData.append("upload_preset", "W4M_preset");

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
          }
        },
      }
    );
    form.avatar = response.data.secure_url;
    avatarId.value = response.data.public_id;
    isUploaded.value = true;
    uploadProgress.value = 100;
  } catch (error) {
    console.error("Errore nell'upload:", error);
  }
};

// On select city suggestion
const onSelectSuggestion = (suggestion: any) => {
  selectSuggestion(suggestion);
  form.city = cityQuery.value;
  form.province = suggestion.address["ISO3166-2-lvl6"]?.slice(-2) || "";
};

// Toggle worker function
const toggleWorker = () => {
  form.isWorker = !form.isWorker;
};

// Toggle skill function
const toggleSkill = (skill: string) => {
  if (form.skills.includes(skill)) {
    form.skills = form.skills.filter((s: string) => s !== skill);
  } else {
    form.skills.push(skill);
  }
};

// Handle submit function
const handleSubmit = async () => {
  await userStore.updateUser(form).then(() => {
    router.push({ path: "/user" });
  });
};
</script>

<template>
  <h1 class="pt-20 md:pt-24 mb-4 text-4xl text-center">I miei dati</h1>
  <!-- Form -->
  <form @submit.prevent="handleSubmit">
    <Card class="mx-2 md:mx-4 lg:mx-auto mb-16 max-w-4xl md:px-4">
      <CardHeader>
        <CardDescription class="text-center text-lg font-normal">
          Modifica i tuoi dati o diventa un Worker
          <hr class="my-2" />
          <span class="text-xs italic">
            N.B. Questo progetto è stato sviluppato a scopo didattico. I dati
            verranno salvati in un database per il corretto funzionamento. Si
            prega di inserire dati fittizi.</span
          >
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2 text-center">
          <Label for="avatar" class="text-sky-950">Avatar</Label>
          <Avatar
            v-if="isUploaded && form.avatar.toString().length == 2"
            class="avatar my-2 mx-auto"
          >
            <AvatarFallback class="content">
              {{ form.avatar }}
            </AvatarFallback>
          </Avatar>
          <Progress
            v-if="!isUploaded"
            v-model="uploadProgress"
            class="w-1/2 scale-50 transition-all duration-200 ease-in-out bg-sky-200 my-8 mx-auto opacity-0"
            :class="{ 'opacity-100': uploadProgress > 0 }"
          />
          <AdvancedImage
            v-if="isUploaded && form.avatar.toString().length > 2"
            :src="form.avatar"
            :cldImg="cldImg"
            class="avatar my-2 mx-auto"
          />

          <Input
            id="avatar"
            @change="handleFileUpload"
            type="file"
            accept="image/*"
            class="mt-2 mb-4 cursor-pointer"
          />
        </div>
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="name">Nome</Label>
              <Input id="name" v-model="form.name" required />
            </div>
            <div class="grid gap-2">
              <Label for="last_name">Cognome</Label>
              <Input
                id="last_name"
                v-model="form.lastName"
                placeholder="Rossi"
                required
              />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="address">Indirizzo</Label>
            <Input
              id="address"
              v-model="form.address"
              placeholder="Via delle Vie 1"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="city" class="text-sky-950">Città</Label>
              <Input
                id="city"
                v-model="cityQuery"
                @blur="validateCity"
                placeholder="Milano"
                required
              />
              <ul
                v-if="suggestions.length"
                class="list-none max-h-[150px] p-0 mt-0 border rounded-b-md border-sky-700 border-opacity-25 overflow-y-auto bg-white shadow-sm"
              >
                <li
                  v-for="(suggestion, index) in suggestions"
                  :key="index"
                  class="text-xs p-3 hover:bg-sky-50 cursor-pointer"
                  :class="{
                    'border-b border-sky-700 border-opacity-15':
                      index !== suggestions.length - 1,
                  }"
                  @click="onSelectSuggestion(suggestion)"
                >
                  {{
                    suggestion.address.city ||
                    suggestion.address.town ||
                    suggestion.address.village
                  }}
                </li>
              </ul>
              <span v-if="cityError" class="text-red-500 text-xs">
                Seleziona una città fra quelle suggerite.
              </span>
            </div>
            <div class="grid gap-2">
              <Label for="province">Provincia</Label>
              <Input
                id="province"
                v-model="form.province"
                placeholder="MI"
                maxlength="2"
                disabled
                required
              />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>

          <div class="flex items-center space-x-2 mt-4">
            <Switch
              id="isWorker"
              :checked="form.isWorker"
              v-model="form.isWorker"
              @update:checked="toggleWorker"
            />
            <Label for="isWorker" class="font-semibold"
              ><h2>Diventa un Worker</h2></Label
            >
          </div>
          <div v-if="form.isWorker === true">
            <CardDescription class="text-sm"
              >Scegli le categorie per visualizzare lavori più compatibili alle
              tue abilità</CardDescription
            >
            <div class="text-center my-3">
              <h3>Categorie</h3>
              <ul class="grid grid-cols-2 gap-3 mt-3" id="skills">
                <li
                  class="flex flex-row text-xs"
                  v-for="skill in skills"
                  :key="skill"
                >
                  <Switch
                    id="skill"
                    :defaultChecked="form.skills.includes(skill)"
                    v-model="form.skills"
                    @update:checked="toggleSkill(skill)"
                    class="scale-75"
                  />
                  <span class="ml-2 my-auto">{{ skill }}</span>
                </li>
              </ul>
            </div>
          </div>
          <hr class="my-2" />
          <div class="grid grid-cols-2 gap-4">
            <Button
              @click="router.push('/user')"
              variant="destructive"
              type="submit"
              class="primary-btn ms-auto hover:!text-red-500"
            >
              Annulla
            </Button>
            <Button
              variant="default"
              type="submit"
              class="primary-btn hover:!text-green-500"
            >
              Aggiorna
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
