<script setup lang="ts">
import type { Card } from '@/model/card'

defineProps<{
  card?: Card
  back?: boolean
}>()
</script>

<template>
  <!-- back of card -->
  <div
    v-if="back"
    class="relative w-24 h-36 rounded-xl border-[6px] border-white shadow-lg overflow-hidden flex items-center justify-center bg-black select-none"
  >
    <!-- UNO logo (text or SVG) -->
    <span class="text-white text-3xl font-bold italic tracking-wider">UNO</span>
  </div>

  <!-- front of card -->
  <div
    v-else-if="card"
    class="relative w-24 h-36 rounded-xl border-[6px] border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold select-none"
    :class="{
      'bg-red-600': card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'RED',
      'bg-green-600': card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'GREEN',
      'bg-blue-600': card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'BLUE',
      'bg-yellow-400': card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'YELLOW',
      'bg-black': card.type === 'WILD' || card.type === 'WILD DRAW',
    }"
  >
    <!-- inner oval -->
    <!-- inner oval -->
    <div
      v-if="card.type !== 'WILD' && card.type !== 'WILD DRAW'"
      class="absolute inset-0 bg-white rounded-full scale-90 -skew-x-[20deg] z-0"
    ></div>

    <!-- multicolor oval for WILD -->
    <div
      v-else
      class="absolute inset-0 rounded-full scale-90 -skew-x-[20deg] z-0 overflow-hidden flex flex-col"
    >
      <div class="flex-1 flex">
        <div class="flex-1 bg-red-600"></div>
        <div class="flex-1 bg-yellow-400"></div>
      </div>
      <div class="flex-1 flex">
        <div class="flex-1 bg-green-600"></div>
        <div class="flex-1 bg-blue-600"></div>
      </div>
    </div>

    <!-- render different based on card.type -->
    <template v-if="card.type === 'NUMBERED'">
      <!-- center number -->
      <span
        class="relative z-10 text-5xl text-outline"
        :class="`text-${card.color?.toLowerCase()}-600`"
      >
        {{ card.number }}
      </span>

      <!-- corners -->
      <span class="absolute top-1 left-2 text-lg z-10">
        {{ card.number }}
      </span>
      <span class="absolute bottom-1 right-2 text-lg rotate-180 z-10">
        {{ card.number }}
      </span>
    </template>

    <template v-else>
      <span v-if="card.type == 'WILD DRAW'" class="absolute top-1 left-2 text-lg z-10">+4</span>
      <span
        v-if="card.type == 'WILD DRAW'"
        class="absolute bottom-1 right-2 text-lg rotate-180 z-10"
        >+4</span
      >

      <!-- action / wild cards -->
      <span
        class="relative z-10 text-5xl"
        :class="{
          'text-red-600': card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'RED',
          'text-green-600':
            card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'GREEN',
          'text-blue-600':
            card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'BLUE',
          'text-yellow-600':
            card.type !== 'WILD' && card.type !== 'WILD DRAW' && card.color === 'YELLOW',
          'text-white': card.type === 'WILD' || card.type === 'WILD DRAW',
        }"
      >
        <span v-if="card.type === 'SKIP'">⦸</span>
        <span v-else-if="card.type === 'REVERSE'">↺</span>
        <span v-else-if="card.type === 'DRAW'">+2</span>
      </span>
    </template>
  </div>
</template>
