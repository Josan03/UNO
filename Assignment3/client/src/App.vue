<script setup lang="ts">
import GameOverScreen from './pages/GameOverScreen.vue'
import GameScreen from './pages/GameScreen.vue'
import SetupScreen from './pages/SetupScreen.vue'
import StartPage from './pages/StartPage.vue'
import { useCurrentScreen } from './stores/useStores'
const screen = useCurrentScreen()
</script>

<template>
  <main class="w-full h-full">
    <div class="w-full h-dvh from-blue-900 to-blue-900 via-blue-300 bg-gradient-to-b">
      <StartPage v-if="screen.currentScreen == 'Start'" />
      <SetupScreen v-if="screen.currentScreen == 'Setup'" />
      <GameScreen v-if="screen.currentScreen == 'Game'" />
      <GameOverScreen v-if="screen.currentScreen == 'GameOver'" />
    </div>
  </main>
</template>
