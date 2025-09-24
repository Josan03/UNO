<script setup lang="ts">
import { useCurrentScreen, useGameStore } from '@/stores/useStores'
import UnoCard from '@/components/UnoCard.vue'
import type { Card } from '@/model/card'

const game = useGameStore()
const screen = useCurrentScreen()
const cardList = [
  { type: 'NUMBERED', color: 'BLUE', number: 4 },
  { type: 'NUMBERED', color: 'GREEN', number: 9 },
  { type: 'WILD', color: 'YELLOW' },
  { type: 'WILD DRAW' },
  { type: 'SKIP', color: 'BLUE' },
  { type: 'DRAW', color: 'RED' },
  { type: 'REVERSE', color: 'YELLOW' },
] as Card[]
</script>
<template>
  <div class="w-full h-dvh p-10 flex flex-col gap-2 bg-blue-200">
    <div>Game Screen</div>
    <p>{{ game.numberOfPlayers }}</p>
    <button
      @click="screen.currentScreen = 'GameOver'"
      class="px-4 py-2 bg-neutral-50 rounded-md hover:border-2 hover:bg-neutral-100 border-neutral-400"
    >
      Finish Game
    </button>
    <div class="flex flex-row gap-1">
      <li v-for="item in cardList" :key="item.value">
        <UnoCard :card="item" />
      </li>
    </div>
  </div>
</template>
