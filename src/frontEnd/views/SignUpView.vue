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
import { useNominatim } from "../composables/useNominatim";

// ---- ShadCn Components
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
// ----

const appStore = useAppStore();
const userStore = useUserStore();
const emailPattern = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const emailValid = ref<boolean>(true);
const passwordValid = ref<boolean>(true);
const confirmPassword = ref<string>("");
const confirmPasswordValid = ref<boolean>(true);
const { cityQuery, suggestions, cityError, selectSuggestion, validateCity } =
  useNominatim();
const avatarId = ref<string>("");
const avatarContent = computed(() => {
  return form.name.slice(0, 1) + form.lastName.slice(0, 1);
});
const isUploaded = ref<boolean>(true);
const uploadProgress = ref<number>(0);

type SignUpForm = Omit<
  User,
  "_id" | "isWorker" | "skills" | "ratings" | "notifications"
>;
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

// Form validation
const formValid = computed(() => {
  return (
    form.name.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.address.trim() !== "" &&
    form.city.trim() !== "" &&
    form.province.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password !== "" &&
    confirmPassword.value !== "" &&
    !cityError.value &&
    emailValid.value &&
    passwordValid.value &&
    confirmPasswordValid.value &&
    form.password === confirmPassword.value
  );
});

// Cloudinary details
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

// Upload file function
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    form.avatar = file;
    uploadOnCloudinary();
  }
};

// Upload on cloudinary function
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

// Validate functions
const validateEmail = () => {
  emailValid.value = emailPattern.test(form.email);
};

const validatePassword = () => {
  passwordValid.value = passwordPattern.test(form.password);
};

const validateConfirmPassword = () => {
  confirmPasswordValid.value = form.password === confirmPassword.value;
};

// Submit function
const handleSubmit = async () => {
  if (!form.avatar) {
    form.avatar = avatarContent.value;
  }
  // emailValid.value = emailPattern.test(form.email);
  // passwordValid.value = passwordPattern.test(form.password);
  if (formValid.value) {
    form.province = form.province.toUpperCase();
    await userStore.signup(form as User).then(() => {
      router.push({ path: "/user/login" });
    });
  } else if (!emailValid.value) {
    return;
  }
};
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
                v-model="cityQuery"
                @blur="validateCity"
                placeholder="Milano"
                required
              />
              <ul
                v-if="suggestions.length"
                class="list-none max-h-[150px] p-0 mt-2 border border-sky-800 overflow-y-auto bg-white"
              >
                <li
                  v-for="(suggestion, index) in suggestions"
                  :key="index"
                  class="p-4 hover:bg-sky-50 cursor-pointer"
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
              <Label for="province" class="text-sky-950">Provincia</Label>
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
            <Label for="email" class="text-sky-950">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              @blur="validateEmail"
              placeholder="m@example.com"
              required
            />
            <span v-if="!emailValid" class="text-red-500 text-xs"
              >Email non valida</span
            >
          </div>
          <div class="grid gap-2">
            <Label for="password" class="text-sky-950">Password</Label>
            <Input
              id="password"
              v-model="form.password"
              @blur="validatePassword"
              type="password"
              required
            />
            <span v-if="!passwordValid" class="text-red-500 text-xs"
              >La password deve contenere almeno 8 caratteri, di cui una lettera
              maiuscola, un numero e un carattere speciale (!@#$%^&*()_+)</span
            >
          </div>
          <div class="grid gap-2">
            <Label for="confirm-password" class="text-sky-950"
              >Conferma password</Label
            >
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              @blur="validateConfirmPassword"
              type="password"
              required
            />
            <span v-if="!confirmPasswordValid" class="text-red-500 text-xs"
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
            <Avatar
              v-if="isUploaded && !form.avatar"
              class="avatar my-2 mx-auto"
            >
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
            :disabled="!formValid"
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
