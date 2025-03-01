<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import router from "../router";
import axios from "axios";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/vue";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { Gravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { useAppStore } from "../stores/appStore";
import { useUserStore } from "../stores/userStore";
import type { User } from "../interfaces/user";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";

type SignUpForm = Omit<User, "_id" | "isWorker" | "skills" | "ratings" | "notifications">;
const form = reactive<SignUpForm>({
  name: "",
  lastName: "",
  address: "",
  city: "",
  province: "",
  email: "",
  password: "",
  avatar: "",
});

const appStore = useAppStore();
const userStore = useUserStore();
const emailPattern = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const emailValid = ref<boolean>(true);
const confirmPassword = ref<string>("");
const avatarId = ref<string>("");
const avatarContent = computed(() => {
  return form.name.slice(0, 1) + form.lastName.slice(0, 1);
});
const isUploaded = ref<boolean>(true);
const uploadProgress = ref<number>(0);

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

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    form.avatar = file;
    uploadOnCloudinary();
  }
};

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

    console.log("Upload riuscito:", response.data);
  } catch (error) {
    console.error("Errore nell'upload:", error);
  }
};

const handleSubmit = async () => {
  if (!form.avatar) {
    form.avatar = avatarContent.value;
  }
  emailValid.value = emailPattern.test(form.email);
  if (emailValid.value && form.password === confirmPassword.value) {
    form.province = form.province.toUpperCase();
    await userStore.signup(form as User).then(() => {
    router.push({ path: "/user/login" });
  });
  } else if (!emailValid.value) {
    return
  }
};
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
      >Questa piattaforma si avvale di servizi basilari di terze parti.<br/> Dopo un lungo periodo di inattività le performance potrebbero variare.</span
    >
  </div>
  <form v-else class="pt-20" @submit.prevent="handleSubmit">
    <Card class="m-2 md:mx-auto md:mt-5 mb-8 max-w-2xl">
      <CardHeader>
        <CardTitle class="text-2xl text-sky-950"> Sign Up </CardTitle>
        <CardDescription>
          Inserisci i tuoi dati per creare un account
          <hr class="my-2" />
          <span class="text-xs italic">
            N.B. Questo progetto è stato sviluppato a scopo didattico. I dati
            verranno salvati in un database per il corretto funzionamento. Si
            prega di inserire dati fittizi.</span
          >
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="name" class="text-sky-950">Nome</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Marco"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="last_name" class="text-sky-950">Cognome</Label>
              <Input
                id="last_name"
                v-model="form.lastName"
                placeholder="Rossi"
                required
              />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="address" class="text-sky-950">Indirizzo</Label>
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
                v-model="form.city"
                placeholder="Milano"
                required
              />
            </div>
            <div class="grid gap-2">
              <Label for="province" class="text-sky-950">Provincia</Label>
              <Input
                id="province"
                v-model="form.province"
                placeholder="MI"
                maxlength="2"
                required
              />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="email" class="text-sky-950">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="m@example.com"
              required
            />
            <span
              v-if="!emailValid"
              class="text-red-500 text-xs"
              >Email non valida</span
            >
          </div>
          <div class="grid gap-2">
            <Label for="password" class="text-sky-950">Password</Label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="confirm-password" class="text-sky-950"
              >Conferma password</Label
            >
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
            />
            <span
              v-if="form.password !== confirmPassword"
              class="text-red-500 text-xs"
              >Le password non corrispondono</span
            >
          </div>
          <div class="grid gap-2 text-center">
            <Label for="avatar" class="text-sky-950">Avatar</Label>
            <Progress
              v-if="!isUploaded"
              v-model="uploadProgress"
              class="w-1/2 scale-50 transition-all duration-150 ease-in-out bg-sky-200 my-8 mx-auto opacity-0"
              :class="{ 'opacity-100': uploadProgress > 0 }"
            />
            <AdvancedImage
              v-if="isUploaded && form.avatar"
              :src="form.avatar"
              :cldImg="cldImg"
              class="avatar my-2 mx-auto"
            />
            <Avatar v-else class="avatar my-2 mx-auto">
              <AvatarFallback class="content">
                {{ avatarContent }}
              </AvatarFallback>
            </Avatar>
            <span class="text-xs opacity-70 text-sky-950 leading-relaxed"
              >Questo e' il tuo avatar predefinito, puoi cambiarlo scegliendo
              un'immagine dalla tua galleria.
              <br />
              (Potrà essere modificato in seguito).</span
            >
            <Input
              id="avatar"
              @change="handleFileUpload"
              type="file"
              accept="image/*"
              class="mt-2 mb-4 cursor-pointer"
            />
          </div>
          <Button
            variant="default"
            type="submit"
            class="primary-btn w-auto mx-auto"
          >
            Crea account
          </Button>
          <span class="text-sm text-center"
            >Hai già un account?
            <a
              class="text-sky-500 font-semibold cursor-pointer"
              @click="$router.push('/user/login')"
              >Accedi</a
            ></span
          >
        </div>
      </CardContent>
    </Card>
  </form>
</template>
