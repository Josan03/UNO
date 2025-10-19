import type { IndexedUnoSpecs } from '@/graphql/game'
import { defineStore } from 'pinia'
import { computed, reactive, type Reactive } from 'vue'

export const usePendingGamesStore = defineStore('pending games', () => {
  const gameList = reactive<IndexedUnoSpecs[]>([])
  const games = computed((): Reactive<Readonly<IndexedUnoSpecs[]>> => gameList)

  const game = (id: string): IndexedUnoSpecs | undefined => {
    return gameList.find((g) => g.id === id)
  }

  const update = (game: Partial<IndexedUnoSpecs>) => {
    const index = gameList.find((g) => g.id === game.id)
    if (index > -1) {
      gameList[index] = { ...gameList[index], ...game }
      return game
    }
  }

  const upsert = (game: IndexedUnoSpecs) => {
    if (gameList.some((g) => g.id === game.id)) {
      update(game)
    } else {
      gameList.push(game)
    }
  }

  const remove = (game: { id: string }) => {
    const index = gameList.findIndex((g) => g.id === game.id)
    if (index > -1) {
      gameList.splice(index, 1)
    }
  }

  return { games, game, update, upsert, remove }
})
