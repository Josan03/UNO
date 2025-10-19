<script setup lang="ts">
import { useOngoingGamesStore } from './stores/ongoing_games_store'
import { usePendingGamesStore } from './stores/pending_games_store'
import { onMounted } from 'vue'
import * as api from '@/graphql/api'
import { usePlayerStore } from './stores/player_store'

const ongoingGamesStore = useOngoingGamesStore()
const pendingGamesStore = usePendingGamesStore()
const playerStore = usePlayerStore()

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
    <div class="w-full h-dvh from-blue-900 to-blue-900 via-blue-300 bg-gradient-to-b">
      <h1 class="header">UNO!!</h1>
      <p>Welcome player: {{ playerStore.player }}</p>
      <RouterView />
    </div>
  </main>
</template>
