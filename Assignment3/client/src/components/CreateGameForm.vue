<script setup lang="ts">
import { usePlayerStore } from '@/stores/player_store'
import * as api from '@/graphql/api'
import { ref } from 'vue'
import router from '@/router'

const playerStore = usePlayerStore()
const selectedNumberOfPlayers = ref(2)

const create_game = async () => {
  if (playerStore.player == undefined) {
    router.push('/login')
  } else {
    const pending_game = await api.create_game(selectedNumberOfPlayers.value, playerStore.player)
    setTimeout(() => router.push(`/pending/${pending_game.id}`), 100)
  }
}
</script>
<template>
  <div>
    Number of players: <input min="1" type="number" v-model="selectedNumberOfPlayers" />
    <button @click="create_game()">New Game</button>
  </div>
</template>
