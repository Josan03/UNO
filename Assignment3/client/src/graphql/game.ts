import type { Round } from '../../../domain/src/model/round'
import {
  createUnoGameFromMemento as from_memento,
  type UnoGame,
  type UnoSpecs,
  type UnoMemento,
} from '../../../domain/src/model/uno'

type Indexed<Y, pending extends boolean> = Readonly<Y & { id: string; pending: pending }>

export type IndexedUno = Indexed<UnoGame, false>

export type IndexedUnoMemento = Indexed<UnoMemento, false>

export function from_memento_indexed(m: IndexedUnoMemento): IndexedUno {
  const playerCount = m.players.length
  return { ...from_memento(m), id: m.id, pending: m.pending, playerCount }
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
