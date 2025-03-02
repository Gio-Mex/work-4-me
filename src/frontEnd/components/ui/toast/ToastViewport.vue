<script setup lang="ts">
import { cn } from '../../../lib/utils'
import { ToastViewport, type ToastViewportProps } from 'radix-vue'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<ToastViewportProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <ToastViewport v-bind="delegatedProps" :class="cn('fixed bottom-0 right-0 w-auto z-[100] flex max-h-screen flex-col-reverse p-2 sm:bottom-0 sm:right-0 sm:flex-col', props.class)" />
</template>
