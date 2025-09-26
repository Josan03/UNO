<script setup lang="ts">
import { useCurrentScreen, useGameStore } from '@/stores/useStores'
import UnoCard from '@/components/UnoCard.vue'
import { RoundClass } from '@/model/round'
import { computed, ref, watchEffect } from 'vue'
import CustomButton from '@/components/CustomButton.vue'
import { standardShuffler } from '@/utils/random_utils'
import PlayerHand from '@/components/PlayerHand.vue'
import { watch } from 'vue'
import type { Color } from '@/model/card'
import BotHand from '@/components/BotHand.vue'

const game = useGameStore()
const screen = useCurrentScreen()

const activePlayerIndex = computed(() => round.value.playerInTurn())

// Build player names: first is real player, rest are bots
const players = computed(() => {
  const arr: string[] = []
  arr.push('Player') // first one is the human
  if (game.numberOfPlayers) {
    for (let i = 1; i < game.numberOfPlayers; i++) {
      arr.push(`Bot-${i}`)
    }
  }
  return arr
})
const round = ref<RoundClass>(new RoundClass(players.value, 0, standardShuffler, 7))

function getNewCard() {
  round.value.draw()
}

function playCard(player: number, cardIndex: number) {
  try {
    round.value.play(cardIndex) // plays from player’s hand
  } catch (err) {
    console.error('Illegal move:', err)
  }
}

const activeColorClass = computed(() => {
  switch (round.value.currentColor) {
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

watchEffect(() => {
  const idx = activePlayerIndex.value
  if (idx !== undefined && idx > 0) {
    setTimeout(() => botPlay(idx), 1000) // shorter delay feels better
  }
})

function botPlay(botIndex: number) {
  // 🔒 Safety: only play if it’s really this bot’s turn
  if (round.value.playerInTurn() !== botIndex) return

  const hand = round.value.playerHand(botIndex)

  // Try to find a playable card
  let played = false
  for (let i = 0; i < hand.length; i++) {
    if (round.value.canPlay(i)) {
      const card = hand[i]
      if (card.type === 'WILD' || card.type === 'WILD DRAW') {
        const colors: Color[] = ['RED', 'GREEN', 'BLUE', 'YELLOW']
        const chosen = colors[Math.floor(Math.random() * colors.length)]
        round.value.play(i, chosen)
      } else {
        round.value.play(i)
      }
      played = true
      break
    }
  }

  // If no playable card → draw
  if (!played) {
    round.value.draw()
  }

  // 🔑 Who’s next?
  const next = round.value.playerInTurn()

  if (next !== undefined && next > 0) {
    if (next === botIndex) {
      // Same bot again (2 players, or skip/draw case)
      setTimeout(() => botPlay(botIndex), 1000)
    } else {
      // Another bot → queue their turn
      setTimeout(() => botPlay(next), 1000)
    }
  }
}

round.value.onEnd(({ winner }) => {
  const name = round.value.player(winner)
  alert(`🎉 ${name} wins the game!`)
  screen.currentScreen = 'GameOver'
})
</script>
<template>
  <div class="w-full h-dvh p-10 flex flex-col items-center justify-center gap-12">
    <!-- Top bar -->
    <div class="absolute top-0 flex flex-row gap-4 items-center w-full justify-between p-1 border">
      <div>players-{{ game.numberOfPlayers }}</div>
      <div>ActivePlayer-{{ round.playerInTurn() }}</div>
      <CustomButton size="sm" type="Cancel" @click="screen.currentScreen = 'GameOver'" />
    </div>

    <div
      v-if="game.numberOfPlayers == 2 || game.numberOfPlayers == 4"
      class="flex flex-col w-full items-center gap-4"
    >
      <BotHand
        class="ml-10"
        :name="round.player(game.numberOfPlayers == 2 ? 1 : 2)"
        :index="1"
        :isActive="activePlayerIndex === (game.numberOfPlayers == 2 ? 1 : 2)"
        :cards="round.playerHand(game.numberOfPlayers == 2 ? 1 : 2)"
        orientation="horizontal"
      />>
      <!-- Plaing Table -->
      <div v-if="game.numberOfPlayers == 2" class="flex flex-row gap-2">
        <div class="flex flex-row gap-1 border-4 rounded-2xl p-2 w-fit">
          <UnoCard back @click="getNewCard" />
          <UnoCard :card="round._discardPile.peek()" />
        </div>
        <div class="flex flex-col justify-between">
          <div class="size-12 rounded-lg" :class="activeColorClass"></div>
          <CustomButton size="sm" type="Skip" />
        </div>
      </div>
    </div>

    <div
      v-if="game.numberOfPlayers == 3 || game.numberOfPlayers == 4"
      class="flex flex-row w-full justify-between"
    >
      <BotHand
        class="ml-10"
        :name="round.player(1)"
        :index="1"
        :isActive="activePlayerIndex === 1"
        :cards="round.playerHand(1)"
        orientation="vertical"
      />

      <!-- Plaing Table -->
      <div class="flex flex-row h-fit gap-2">
        <div class="flex flex-row gap-1 border-4 rounded-2xl p-2 w-fit">
          <UnoCard back @click="getNewCard" />
          <UnoCard :card="round._discardPile.peek()" />
        </div>
        <div class="flex flex-col justify-between">
          <div class="size-12 rounded-lg" :class="activeColorClass"></div>
          <CustomButton size="sm" type="Skip" />
        </div>
      </div>

      <BotHand
        class="ml-10"
        :name="round.player(game.numberOfPlayers == 3 ? 2 : 3)"
        :index="2"
        :isActive="activePlayerIndex === (game.numberOfPlayers == 3 ? 2 : 3)"
        :cards="round.playerHand(game.numberOfPlayers == 3 ? 2 : 3)"
        orientation="vertical"
      />
    </div>

    <!-- Player Card -->

    <!-- Player hand bottom -->
    <PlayerHand
      :name="round.player(0)"
      :index="0"
      :isActive="activePlayerIndex === 0"
      :cards="round.playerHand(0)"
      :onPlay="(i, c) => round.play(i, c)"
      class="mt-12"
    />
  </div>
</template>
