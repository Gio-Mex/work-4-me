<script setup lang="ts">
import { reactive } from "vue";
import router from "../router";

import { useUserStore } from "../stores/userStore";

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

const userStore = useUserStore();
const form = reactive({
  email: "",
  password: "",
});

const handleSubmit = async () => {
  await userStore.login(form as any).then(() => {
      router.push({ path: "/" });
  })
}
</script>

<template>
  <form class="pt-20" @submit.prevent="handleSubmit">
    <Card class="m-2 md:mx-auto md:mt-5 max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl text-sky-950"> Login </CardTitle>
        <CardDescription> Inserisci i dati del tuo account </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="email" class="text-sky-950">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password" class="text-sky-950">Password</Label>
            </div>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              required
            />
          </div>
          <Button type="submit" class="primary-btn mx-auto"> Login </Button>
        </div>
        <div class="mt-4 text-center text-sm">
          Non hai un account?
          <a
            class="text-sky-500 font-semibold cursor-pointer"
            @click="$router.push('/user/signup')"
          >
            Registrati
          </a>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
