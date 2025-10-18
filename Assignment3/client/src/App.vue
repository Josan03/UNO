<script setup lang="ts">
import { useOngoingGamesStore } from './stores/ongoing_games_store'
import { usePendingGamesStore } from './stores/pending_games_store'
import { onMounted } from 'vue'
import * as api from '@/model/API/api'

const ongoingGamesStore = useOngoingGamesStore()
const pendingGamesStore = usePendingGamesStore()

async function initGames() {
  const games = await api.games()
  games.forEach(ongoingGamesStore.upsert)

  const pending_games = await api.pending_games()
  pending_games.forEach(pendingGamesStore.upsert)
}

function liveUpdateGames() {
  api.onGame((game) => {
    ongoingGamesStore.upsert(game)
    pendingGamesStore.remove(game)
  })
  api.onPending(pendingGamesStore.upsert)
}

onMounted(async () => {
  await initGames()
  liveUpdateGames()
})
</script>

<template>
  <main class="w-full h-full">
    <h1 class="header">UNO</h1>
    <RouterView />
  </main>
</template>
