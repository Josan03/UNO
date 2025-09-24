<script setup lang="ts">
import logo from '@/assets/uno-game-logo.png'
import CustomButton from '@/components/CustomButton.vue'
import { useCurrentScreen } from '@/stores/useStores'

const screen = useCurrentScreen()
</script>

<template>
  <div class="w-full h-dvh flex flex-col items-center justify-center gap-10">
    <img :src="logo" alt="Game logo" class="w-92 h-auto drop-shadow-lg" />
    <CustomButton size="lg" type="Play" @click="screen.currentScreen = 'Setup'" />
  </div>
</template>
