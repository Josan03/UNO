<script setup lang="ts">
import { usePlayerStore } from '@/stores/player_store'
import * as api from '@/model/API/api'
import { ref } from 'vue'
import router from '@/router'
import { usePendingGamesStore } from '@/stores/pending_games_store'

const playerStore = usePlayerStore()
const pendingGamesStore = usePendingGamesStore()
const selectedNumberOfPlayers = ref(2)

const create_game = async (player: string) => {
  const pending_game = await api.create_game(selectedNumberOfPlayers.value, player)

  if (pending_game) {
  }

  setTimeout(() => router.push(`/pending/${pending_game.id}`), 200)
}

if (playerStore.player === undefined) router.push('/login')
</script>
<template>
  <div>
    Number of players: <input min="1" type="number" v-model="selectedNumberOfPlayers" />
    <button @click="create_game(playerStore.player)">New Game</button>
  </div>
</template>
