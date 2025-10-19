import type { Round } from '@/model/round'
import { from_memento, type Game } from '@/model/uno'
import type { GameMemento } from '@/model/uno'

type Indexed<Y, pending extends boolean> = Readonly<Y & { id: string; pending: pending }>

export type IndexedUno = Indexed<Game, false>

export type IndexedUnoMemento = Indexed<GameMemento, false>

type UnoSpecs = {
  creator: string
  number_of_players: number
}

export function from_memento_indexed(m: IndexedUnoMemento): IndexedUno {
  return { ...from_memento(m), id: m.id, pending: m.pending }
}
export type IndexedUnoSpecs = Indexed<UnoSpecs, true>

type GraphQLGame = {
  id: string
  pending: boolean
  players: readonly string[]
  targetScore: number
  scores: number[]
  cardsPerPlayer?: number
  currentRound?: Round
}

export function from_graphql_game({
  id,
  players,
  targetScore,
  scores,
  cardsPerPlayer,
  currentRound,
}: GraphQLGame): IndexedUno {
  const m: IndexedUnoMemento = {
    id,
    targetScore,
    scores, // scores is already an array of numbers from GraphQLGame
    currentRound,
    cardsPerPlayer: cardsPerPlayer ?? 7,
    players: [...players], // Convert readonly array to mutable
    pending: false,
  }
  return from_memento_indexed(m)
}
