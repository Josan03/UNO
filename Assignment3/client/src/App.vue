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
  <main
    class="w-full h-full min-h-dvh max-h-dvh bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900"
  >
    <RouterView />
  </main>
</template>
