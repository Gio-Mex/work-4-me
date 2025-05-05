<script setup lang="ts">
import type { NumberFieldDecrementProps } from 'radix-vue'
import { cn } from '../../../lib/utils'
import { Minus } from 'lucide-vue-next'
import { NumberFieldDecrement, useForwardProps } from 'radix-vue'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<NumberFieldDecrementProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldDecrement data-slot="decrement" v-bind="forwarded" :class="cn('absolute top-1/2 -translate-y-1/2 left-0 p-3 text-sky-200 bg-sky-900 hover:bg-sky-950 rounded-s-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:bg-sky-900 disabled:scale-100', props.class)">
    <slot>
      <Minus class="h-4 w-4" />
    </slot>
  </NumberFieldDecrement>
</template>
