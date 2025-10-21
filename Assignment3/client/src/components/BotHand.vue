<script setup lang="ts">
import UnoCard from '@/components/UnoCard.vue'
import type { Card } from '../../../domain/src/model/card'

defineProps<{
  name: string | undefined
  isActive: boolean
  cards: Card[] | undefined
  orientation?: 'horizontal' | 'vertical' // flex row vs column
}>()
</script>

<template>
  <div
    class="flex gap-2 items-center transition-all"
    :class="{
      'opacity-50': !isActive,
      'flex-col': orientation === 'horizontal',
      'flex-row': orientation === 'vertical',
    }"
  >
    <!-- Cards (back only) -->
    <div :class="[orientation === 'horizontal' ? 'flex flex-row gap-1 ' : 'flex flex-col']">
      <div
        v-for="(_, idx) in cards"
        :key="idx"
        :class="[orientation === 'horizontal' ? 'ml-[-40px]' : 'mb-[-110px]']"
      >
        <UnoCard back />
      </div>
    </div>

    <!-- Bot name -->
    <p class="text-center text-xl font-bold text-white">{{ name }}</p>
  </div>
</template>
