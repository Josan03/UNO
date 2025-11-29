import { configureStore } from "@reduxjs/toolkit"
import { player_slice, type PlayerState } from "../slices/player_slice"
import { pending_games_slice, type PendingGamesState } from "../slices/pending_games_slice"
import { ongoing_games_slice, type OngoingGamesState } from "../slices/ongoing_games_slice"

export type State = { 
  player: PlayerState, 
  pending_games: PendingGamesState, 
  ongoing_games: OngoingGamesState 
}

export const store = configureStore<State>({
    reducer: { 
      player: player_slice.reducer, 
      pending_games: pending_games_slice.reducer, 
      ongoing_games: ongoing_games_slice.reducer 
    }
})

export type StoreType = typeof store
export type Dispatch = StoreType['dispatch']
export type GetState = StoreType['getState']
export type Subscriber = Parameters<StoreType['subscribe']>[0]
