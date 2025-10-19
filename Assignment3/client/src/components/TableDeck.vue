<script setup lang="ts">
import type { Card } from '../../../domain/src/model/deck'
import UnoCard from './UnoCard.vue'

defineProps<{
  discardCard: Card | undefined
}>()
</script>

<template>
  <div class="flex flex-row gap-1 border-4 rounded-2xl p-2 w-fit">
    <UnoCard back />
    <UnoCard :card="discardCard" />
  </div>
</template>
