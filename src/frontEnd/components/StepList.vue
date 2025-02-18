<script setup lang="ts">

defineProps<{
  steps: {
    step: number;
    title: string;
    description: string;
    icon: string;
    selected: boolean;
  }[];
  selectStep: (step: number) => void;
}>();
</script>

<template>
  <div class="flex flex-col md:flex-row justify-center items-start mt-10 px-4">
    <div v-for="item in steps" :key="item.step" class="flex flex-col md:flex-row md:items-baseline">
      <div class="flex flex-row md:flex-col items-center gap-3">
        <div
          class="bg-sky-950 text-sky-200 p-3 rounded cursor-pointer hover:bg-sky-200 hover:text-sky-950 hover:scale-125 transition-all duration-250 ease-in-out"
          :class="{ '!bg-sky-200 text-sky-950 scale-125': item.selected }"
          @click="selectStep(item.step)"
        >
          <span class="material-symbols-outlined align-middle">{{ item.icon }}</span>
        </div>
        <div class="-space-y-5 md:space-y-0">
          <h3 class="w-full text-sky-400 font-semibold text-left md:text-center transition-all duration-250 ease-in-out"
            :class="{ '-translate-y-5 md:translate-y-0': item.selected }">
            {{ item.title }}
          </h3>
          <p class="md:w-[110px] lg:w-[130px] text-sky-950 md:text-center text-sm opacity-0 transition-all duration-300 ease-in-out"
            :class="{ 'opacity-80': item.selected }">
            {{ item.description }}
          </p>
        </div>
      </div>
      <section
        v-if="item.step < steps.length"
        class="h-[25px] w-[0px] md:w-[35px] lg:w-[50px] md:h-[0px] border m-6 md:m-0 border-sky-100"
      ></section>
    </div>
  </div>
</template>