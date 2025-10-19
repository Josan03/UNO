<script setup lang="ts">
import PlayerHand from '@/components/PlayerHand.vue'
import { useOngoingGamesStore } from '@/stores/ongoing_games_store'
import { usePlayerStore } from '@/stores/player_store'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PlayerHandProps } from '@/components/PlayerHand.vue'
import type { Color } from '../../../domain/src/model/card'
import { findPlayerIndexfromList } from '@/utils/helpers'
import * as api from '@/graphql/api'
import UnoCard from '@/components/UnoCard.vue'
import CustomButton from '@/components/CustomButton.vue'
import { hasColor } from '../../../domain/src/utils/helpers'

const ongoingGamesStore = useOngoingGamesStore()
const playerStore = usePlayerStore()
const router = useRouter()

const route = useRoute()
let id = ref(route.params.id.toString())
console.log('Print active games')
const game = ongoingGamesStore.game(id.value)
console.log(game)
if (!playerStore.player) router.push(`/login?game=${id.value}`)

async function onPlayDemoFunction({
  playCardId,
  playerIndex,
  cardIndex,
  namedColor,
}: api.PlayCardApiProps) {
  api.play_card({ playCardId, playerIndex, cardIndex, namedColor })
}

const playerHand = {
  playCardId: game?.id ? game.id : 0,
  name: playerStore.player,
  index: findPlayerIndexfromList(playerStore.player, game?.players),
  isActive:
    game?.currentRound?.currentPlayerIndex ===
    findPlayerIndexfromList(playerStore.player, game?.players),
  cards: game?.currentRound?.playerHand(0),
  onPlay: onPlayDemoFunction,
} as PlayerHandProps

console.log('PlayerHand')
console.log(playerHand)

const activeColorClass = computed(() => {
  let color: Color = 'RED'
  const card = game?.currentRound?.discardPile().peek()
  if (card) {
    if (hasColor(card)) {
      color = card.color
    }
  }

  switch (color) {
    case 'RED':
      return 'bg-red-600'
    case 'GREEN':
      return 'bg-green-600'
    case 'BLUE':
      return 'bg-blue-600'
    case 'YELLOW':
      return 'bg-yellow-400'
    default:
      return 'bg-gray-500' // fallback if undefined
  }
})

async function getNewCard() {
  game?.currentRound?.draw()
}
</script>
<template>
  <div>
    <h2 class="text-xl font-bold mb-2">Active Games</h2>
    <ul>
      <li>ID: {{ game?.id }}</li>
      <li>Pending: {{ game?.pending }}</li>
      <li>Players: {{ game?.players }}</li>
      <li>TargetScore: {{ game?.targetScore }}</li>

      <!-- Plaing Table -->
      <div class="flex flex-row gap-2">
        <div class="flex flex-row gap-1 border-4 rounded-2xl p-2 w-fit">
          <UnoCard back @click="getNewCard" />
          <UnoCard :card="game?.currentRound?.discardPile().peek()" />
        </div>
        <div class="flex flex-col justify-between">
          <div class="size-12 rounded-lg" :class="activeColorClass"></div>
          <CustomButton size="sm" type="Skip" />
        </div>
      </div>

      <PlayerHand
        :play-card-id="playerHand.playCardId"
        :name="playerHand.name"
        :index="playerHand.index"
        :isActive="playerHand.isActive"
        :cards="playerHand.cards"
        :onPlay="playerHand.onPlay"
        class="mt-12"
      />
    </ul>
  </div>
</template>
