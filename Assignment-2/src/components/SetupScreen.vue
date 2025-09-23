<script setup lang="ts">
import { useCurrentScreen, useGameStore } from '@/stores/useStores'

//const playerName = ref('')
//const numberOfPlayers = ref<number | null>(null)

const game = useGameStore()
const screen = useCurrentScreen()
</script>

<template>
  <div class="flex flex-col gap-5">
    <h2 class="text-2xl">Start a new Game</h2>
    <div class="flex flex-row gap-2 items-center">
      <p class="uppercase">Select the number of players !</p>
      <button
        :class="[
          'px-2 py-0.5 rounded-md',
          game.numberOfPlayers == 2 ? 'bg-green-100 border-green-500 border-2' : 'bg-neutral-300',
        ]"
        @click="game.numberOfPlayers = 2"
      >
        2
      </button>
      <button
        :class="[
          'px-2 py-0.5 rounded-md',
          game.numberOfPlayers == 3 ? 'bg-green-100 border-green-500 border-2' : 'bg-neutral-300',
        ]"
        @click="game.numberOfPlayers = 3"
      >
        3
      </button>
      <button
        :class="[
          'px-2 py-0.5 rounded-md',
          game.numberOfPlayers == 4 ? 'bg-green-100 border-green-500 border-2' : 'bg-neutral-300',
        ]"
        @click="game.numberOfPlayers = 4"
      >
        4
      </button>
    </div>
    <div>
      <button
        @click="screen.currentScreen = 'Game'"
        class="px-4 py-2 uppercase bg-green-50 rounded-md hover:border-2 hover:bg-green-300 border-green-500"
      >
        Start Game
      </button>
    </div>
  </div>
</template>
