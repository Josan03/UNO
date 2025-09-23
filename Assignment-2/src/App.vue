<script setup lang="ts">
import GameOverScreen from './components/GameOverScreen.vue'
import GameScreen from './components/GameScreen.vue'
import SetupScreen from './components/SetupScreen.vue'
import { useCurrentScreen } from './stores/useStores'
const screen = useCurrentScreen()
</script>

<template>
  <main class="w-full h-full">
    <SetupScreen v-if="screen.currentScreen == 'Setup'" />
    <GameScreen v-if="screen.currentScreen == 'Game'" />
    <GameOverScreen v-if="screen.currentScreen == 'GameOver'" />
  </main>
</template>
