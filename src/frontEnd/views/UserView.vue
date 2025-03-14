<script setup lang="ts">
import { useUserStore } from "../stores/userStore";
import router from "../router";
// ---- ShadCn Components
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
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
} from '../components/ui/alert-dialog'
// ----
const userStore = useUserStore();
const user = userStore.user;
console.log(user);
// Delete account function
const handleDeleteAccount = async () => {
  await userStore.deleteUser().then(() => {
    router.push('/')
  })
}
</script>

<template>
<div class="py-2 px-4 md:px-8 space-y-7 mb-16">
  <div class="flex flex-col mt-20 md:mt-24 space-y-2">
    <Avatar class="avatar mx-auto">
    <AvatarImage :src="user!.avatar?.toString()" alt="Avatar" />
    <AvatarFallback class="content">
      {{ user!.avatar }}
    </AvatarFallback>
  </Avatar>
  <h1 class="text-3xl text-center">Il mio account</h1>
  </div>
  
  <p class="mt-10">  
    Qui potrai modificare i tuoi
    dati e scegliere se diventare un Worker.
  </p>  
  <Button @click="router.push(`/user/${ user!._id }`)" class="primary-btn w-[160px]">Modifica account</Button>
  <hr>
  <p>
    Controlla lo storico delle tue richieste, o dei tuoi lavori
    da Worker.
  </p>
  <Button @click="router.push(`jobs/${ user!._id }/archived`)" class="primary-btn w-[160px] ">Archivio</Button>
  <hr>
  <p>
    Vuoi eliminare il tuo account? 
  </p>
  <!-- Alert Dialog -->
  <AlertDialog>
    <AlertDialogTrigger as-child>
       <Button  class="w-[160px] text-sky-950" variant="destructive">Elimina account</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="text-center">Confermi di voler eliminare il tuo account?</AlertDialogTitle>
        <AlertDialogDescription class="text-red-500 text-center">
          Attenzione, questa azione è irreversibile!<br />
          I tuoi dati verranno eliminati dal database in maniera definitiva.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="grid grid-cols-2 space-x-2">
        <AlertDialogCancel class="mt-0 w-full primary-btn">Annulla</AlertDialogCancel>
        <AlertDialogAction @click="handleDeleteAccount" class="bg-red-500 text-sky-950 hover:text-red-500 hover:bg-sky-950">Continua</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
</template>
