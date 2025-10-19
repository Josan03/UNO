<script setup lang="ts">
import CreateGameForm from '@/components/CreateGameForm.vue'
import router from '@/router'
import { useOngoingGamesStore } from '@/stores/ongoing_games_store'
import { usePendingGamesStore } from '@/stores/pending_games_store'
import { usePlayerStore } from '@/stores/player_store'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const playerStore = usePlayerStore()
if (playerStore.player === undefined) router.push('/login')

const ongoingGamesStore = useOngoingGamesStore()
const pendingGamesStore = usePendingGamesStore()

const isParticipant = (g: { players: readonly string[] }) =>
  g.players.indexOf(playerStore.player ?? '') > -1

const pending_games = computed(() => pendingGamesStore.games.filter((g) => g.pending == true))
const my_ongoing_games = computed(() => ongoingGamesStore.games.filter((g) => isParticipant(g)))
//const ongoing_games = computed(() => ongoingGamesStore.games)

//console.log(ongoing_games.value)
</script>
<template>
  <main>
    <h1>Loby Screen</h1>

    <CreateGameForm />

    <div class="border p-4">
      <nav class="flex flex-col gap-1">
        <h2 class="font-semibold text-lg italic">Pending Games</h2>
        <RouterLink
          class="link"
          v-for="game in pending_games"
          :to="`/pending/${game.id}`"
          :key="game.id"
          >Pending-Game #{{ game.id }}</RouterLink
        >

        <h3 class="font-semibold text-lg italic">My Ongoing Games</h3>
        <RouterLink
          class="link"
          v-for="game in my_ongoing_games"
          :to="`/game/${game.id}`"
          :key="game.id"
          >Game #{{ game.id }}</RouterLink
        >
      </nav>
    </div>
  </main>
</template>
