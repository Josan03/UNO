import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', () => {
  const numberOfPlayers = ref<number | null>(null)

  return {
    numberOfPlayers,
  }
})

export const useCurrentScreen = defineStore('screen', () => {
  type CurrentScreenProp = 'Setup' | 'Game' | 'GameOver'

  const currentScreen = ref<CurrentScreenProp>('Setup')

  return { currentScreen }
})
