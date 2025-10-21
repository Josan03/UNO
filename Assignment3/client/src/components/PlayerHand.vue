<script setup lang="ts">
import UnoCard from '@/components/UnoCard.vue'
import type { Card, Color } from '../../../domain/src/model/card'
import { ref } from 'vue'
import type { PlayCardApiProps } from '@/graphql/api'

export type PlayerHandProps = {
  playCardId: number
  name: string
  index: number
  isActive: boolean
  cards: Card[]
  onPlay: ({
    cardIndex,
    namedColor,
    playerIndex,
    playCardId,
  }: PlayCardApiProps) => void | Promise<void>
}

const props = defineProps<PlayerHandProps>()

// track wild selection UI locally
const wildChoice = ref<number | null>(null)

function handleClick(card: Card, idx: number) {
  if (!card) return
  if (!props.isActive) return

  if (card.type === 'WILD' || card.type == 'WILD_DRAW') {
    console.log(card.type)
    wildChoice.value = idx
  } else {
    props.onPlay({
      cardIndex: idx,
      playCardId: props.playCardId,
      playerIndex: props.index,
    })
  }
}

function chooseColor(color: Color) {
  console.log('Inside the seelct color')
  try {
    console.log(color)
    console.log(`Whild Choice value ${wildChoice.value}`)
    props.onPlay({
      cardIndex: Number(wildChoice.value),
      playCardId: props.playCardId,
      playerIndex: props.index,
      namedColor: color,
    })
    wildChoice.value = null
  } catch (err) {
    console.error('Error playing card:', err)
    console.log(err)
  }
}
</script>

<template>
  <div
    class="flex flex-col w-fit gap-2 px-10 py-4 rounded-lg transition-all"
    :class="{
      'opacity-50': !isActive,
    }"
  >
    <p class="text-center text-3xl font-bold text-white">{{ name }}</p>

    <div class="flex flex-row gap-1">
      <li v-for="(card, idx) in cards" :key="idx" @click="handleClick(card, idx)">
        <div class="ml-[-20px]">
          <UnoCard :card="card" class="transition-transform hover:scale-105" />
        </div>
      </li>
    </div>

    <!-- Wild card picker -->
    <div v-if="wildChoice !== null" class="flex gap-2 mt-2">
      <button
        class="w-8 h-8 transition-transform hover:scale-105 rounded bg-red-600"
        @click="chooseColor('RED')"
      ></button>
      <button
        class="w-8 h-8 transition-transform hover:scale-105 rounded bg-yellow-400"
        @click="chooseColor('YELLOW')"
      ></button>
      <button
        class="w-8 h-8 transition-transform hover:scale-105 rounded bg-green-600"
        @click="chooseColor('GREEN')"
      ></button>
      <button
        class="w-8 h-8 transition-transform hover:scale-105 rounded bg-blue-600"
        @click="chooseColor('BLUE')"
      ></button>
    </div>
  </div>
</template>
