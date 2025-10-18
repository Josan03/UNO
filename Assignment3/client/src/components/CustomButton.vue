<script setup lang="ts">
import CancelIcon from './icons/CancelIcon.vue'
import CheckIcon from './icons/CheckIcon.vue'
import InfoIcon from './icons/InfoIcon.vue'
import PlayIcon from './icons/PlayIcon.vue'
import SkipIcon from './icons/SkipIcon.vue'

defineProps<{
  type: 'Play' | 'Cancel' | 'Skip' | 'Check' | 'Info'
  size: 'lg' | 'md' | 'sm'
}>()

// default = md
const sizeClasses: Record<'lg' | 'md' | 'sm', string> = {
  lg: 'w-20 h-20',
  md: 'w-16 h-16',
  sm: 'w-12 h-12',
}
</script>
<!-- GameButton.vue -->
<template>
  <button
    :class="[
      'relative flex items-center justify-center rounded-md border border-blue-800',
      'bg-gradient-to-b from-gray-900 to-black',
      'shadow-[inset_2px_2px_6px_rgba(255,255,255,0.2),inset_-2px_-2px_6px_rgba(0,0,0,0.6)]',
      'hover:scale-105 active:scale-95 transition-transform',
      sizeClasses[size || 'md'],
    ]"
  >
    <PlayIcon v-if="type === 'Play'" />
    <CancelIcon v-else-if="type === 'Cancel'" />
    <SkipIcon v-else-if="type === 'Skip'" />
    <CheckIcon v-else-if="type === 'Check'" />
    <InfoIcon v-else-if="type === 'Info'" />
  </button>
</template>
