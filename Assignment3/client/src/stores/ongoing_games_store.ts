import { computed, reactive, type Reactive } from 'vue'
import { defineStore } from 'pinia'
import type { IndexedUno } from '@/graphql/game'

export const useOngoingGamesStore = defineStore('ongoing games', () => {
  const gameList = reactive<IndexedUno[]>([])
  const games = computed((): Reactive<Readonly<IndexedUno[]>> => gameList)
  const game = (id: string): IndexedUno | undefined => gameList.find((g) => g.id === id)
  const update = (game: IndexedUno) => {
    const index = gameList.findIndex((g) => g.id === game.id)
    if (index > -1) {
      gameList[index] = game
      return game
    }
  }
  const upsert = (game: IndexedUno) => {
    if (gameList.some((g) => g.id === game.id)) {
      update(game)
    } else {
      gameList.push(game)
    }
  }

  return { games, game, update, upsert }
})
