<script setup lang="ts">
const props = defineProps<{
  players: '2' | '3' | '4'
}>()

const colors: Record<2 | 3 | 4, string> = {
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-red-500',
}
</script>

<template>
  <button
    :class="[
      'relative flex items-center justify-center w-24 h-24 rounded-md',
      'shadow-lg hover:scale-105 active:scale-95 transition-transform',
    ]"
  >
    <!-- Diamond background -->
    <div :class="['absolute inset-0 rotate-45 rounded-md', colors[props.players]]"></div>

    <!-- Number -->
    <span class="relative text-white text-3xl font-bold drop-shadow">
      {{ props.players }}
    </span>
  </button>
</template>
