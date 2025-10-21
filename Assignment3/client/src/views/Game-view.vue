<script setup lang="ts">
import PlayerHand from '@/components/PlayerHand.vue'
import { useOngoingGamesStore } from '@/stores/ongoing_games_store'
import { usePlayerStore } from '@/stores/player_store'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PlayerHandProps } from '@/components/PlayerHand.vue'
import type { Card } from '../../../domain/src/model/card'
import { findPlayerIndexfromList } from '@/utils/helpers'
import * as api from '@/graphql/api'
import UnoCard from '@/components/UnoCard.vue'
import CustomButton from '@/components/CustomButton.vue'
import BotHand from '@/components/BotHand.vue'

const ongoingGamesStore = useOngoingGamesStore()
const playerStore = usePlayerStore()
const router = useRouter()

const route = useRoute()
const id = ref(route.params.id.toString())
const game = computed(() => ongoingGamesStore.game(id.value))
if (!playerStore.player) router.push(`/login?game=${id.value}`)

const currentPlayerName = computed(() => playerStore.player || '')
const currentPlayerIndex = computed(() =>
  findPlayerIndexfromList(currentPlayerName.value, game.value?.players),
)
const isCurrentPlayerActive = computed(
  () => game.value?.currentRound?.currentPlayerIndex == currentPlayerIndex.value,
)

// Player slots computation
type PlayerSlot = {
  id: string
  name: string
  index: number
  isHuman: boolean
  isActive: boolean
  cards: Card[]
  position: 'bottom' | 'left' | 'top' | 'right'
  orientation: 'horizontal' | 'vertical'
}

const playerSlots = computed<PlayerSlot[]>(() => {
  if (!game.value?.players) return []

  // Get the current player's position in the array
  const myIndex = currentPlayerIndex.value || 0
  const totalPlayers = game.value.players.length

  // Create a rotated array where current player is always first
  return game.value.players.map((name, i) => {
    // Calculate the real index in the game's player array
    const realIndex = (myIndex + i) % totalPlayers

    // Determine position and orientation based on slot
    let position: 'bottom' | 'left' | 'top' | 'right'
    let orientation: 'horizontal' | 'vertical'

    if (i === 0) {
      position = 'bottom'
      orientation = 'horizontal'
    } else if (totalPlayers === 2 || i === 2) {
      position = 'top'
      orientation = 'horizontal'
    } else {
      position = i === 1 ? 'left' : 'right'
      orientation = 'vertical'
    }

    return {
      id: `${realIndex}-${name}`,
      name: game.value.players[realIndex],
      index: realIndex,
      isHuman: realIndex === myIndex,
      isActive: game.value.currentRound?.currentPlayerIndex === realIndex,
      cards: game.value.currentRound?.playerHand(realIndex) || [],
      position,
      orientation,
    }
  })
})

async function onPlayDemoFunction({
  playCardId,
  playerIndex,
  cardIndex,
  namedColor,
}: api.PlayCardApiProps) {
  await api.play_card({ playCardId, playerIndex, cardIndex, namedColor })
}

const activeColorClass = computed(() => {
  const color = game.value?.currentRound?.currentColor
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

function getSlotPositionClasses(position: 'bottom' | 'left' | 'top' | 'right'): string {
  switch (position) {
    case 'bottom':
      return 'bottom-4 left-1/2 -translate-x-1/2'
    case 'top':
      return 'top-10 left-1/2 -translate-x-1/2'
    case 'left':
      return 'left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-left'
    case 'right':
      return 'right-4 top-1/2 -translate-y-1/2 rotate-90 origin-right'
  }
}

async function getNewCard() {
  console.log(
    'isCurrentPlayerActive',
    isCurrentPlayerActive.value,
    'currentPlayerIndex',
    currentPlayerIndex.value,
    'game',
    game.value,
  )
  if (isCurrentPlayerActive.value) {
    await api.draw_card(Number(game.value?.id), currentPlayerIndex.value || 0)
    console.log('Draw card called')
  } else {
    console.log('Not your turn!')
  }
}

// Screen navigation
function navigateToGameOver() {
  router.push('/')
}

// Watch for game end
watchEffect(() => {
  const currentGame = game.value
  if (currentGame?.currentRound?.hasEnded && currentGame.currentRound.hasEnded()) {
    navigateToGameOver()
  }
})
</script>
<template>
  <div class="h-full w-full max-h-dvh flex flex-col">
    <!-- Game header -->
    <div class="px-4 py-2">
      <div class="flex items-center justify-between mx-auto">
        <div class="flex items-center gap-8">
          <div class="text-blue-200">Players: {{ game?.players?.length }}</div>
          <div class="text-blue-200">
            Turn:
            <span class="font-bold text-white">{{ game?.currentRound?.currentPlayerIndex }}</span>
          </div>
        </div>
        <CustomButton
          size="sm"
          type="Cancel"
          @click="navigateToGameOver"
          class="hover:bg-red-600 transition-colors"
        />
      </div>
    </div>

    <!-- Game area -->
    <div class="h-fit w-full flex items-center justify-center p-4">
      <!-- Players area -->
      <div class="w-full max-w-7xl aspect-auto mx-auto">
        <template v-for="slot in playerSlots" :key="slot.id">
          <div
            :class="[
              'absolute transition-transform duration-300 ease-in-out',
              getSlotPositionClasses(slot.position),
              {
                'opacity-75 hover:opacity-100 transition-opacity': !slot.isActive,
                'ring-4 ring-yellow-400/50 rounded-lg': slot.isActive,
              },
            ]"
          >
            <component
              :is="slot.isHuman ? PlayerHand : BotHand"
              :play-card-id="game?.id"
              :name="slot.name"
              :index="slot.index"
              :isActive="slot.isActive"
              :cards="slot.cards"
              :orientation="slot.orientation"
              :onPlay="onPlayDemoFunction"
              :class="[
                'transition-all duration-300',
                slot.orientation === 'vertical' ? 'w-48' : 'w-full max-w-xl',
                slot.isActive ? 'scale-105' : 'scale-100',
              ]"
            />
          </div>
        </template>

        <!-- Center table -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 p-8 rounded-2xl bg-blue-950/30 backdrop-blur-sm border border-blue-500/20 shadow-xl shadow-blue-900/50"
        >
          <!-- Cards area -->
          <div class="flex items-center gap-6">
            <div class="relative group">
              <UnoCard
                back
                @click="getNewCard"
                class="transition-transform hover:scale-105 hover:-rotate-3 z-50"
              />
              <div
                class="absolute inset-0 rounded-lg ring-2 ring-blue-400/30 group-hover:ring-blue-400/50 transition-all"
              ></div>
            </div>
            <UnoCard
              :card="game?.currentRound?.discardPile?.peek()"
              class="transition-transform hover:scale-105"
            />
          </div>

          <!-- Color indicator and controls -->
          <div class="flex items-center gap-4">
            <div
              :class="[
                'w-12 h-12 rounded-lg shadow-lg transition-colors duration-300',
                activeColorClass,
                'ring-2 ring-white/20',
              ]"
            ></div>
            <CustomButton
              size="sm"
              type="Skip"
              class="bg-blue-600 hover:bg-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
