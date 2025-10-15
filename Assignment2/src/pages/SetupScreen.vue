<script setup lang="ts">
import PlayerButton from '@/components/PlayerButton.vue'
import { useCurrentScreen, useGameStore } from '@/stores/useStores'

const game = useGameStore()
const screen = useCurrentScreen()
const setNrOfPlayers = (players: number) => {
  game.numberOfPlayers = players
  screen.currentScreen = 'Game'
}
</script>

<template>
  <div class="z-50 w-full h-dvh flex flex-col gap-10 bg-black/60 items-center justify-center">
    <h2 class="uppercase text-5xl font-extrabold text-white">Select the number of players !</h2>
    <div class="flex flex-row">
      <PlayerButton players="2" @click="setNrOfPlayers(2)" />
      <PlayerButton players="3" @click="setNrOfPlayers(3)" />
      <PlayerButton players="4" @click="setNrOfPlayers(4)" />
    </div>
  </div>
</template>
