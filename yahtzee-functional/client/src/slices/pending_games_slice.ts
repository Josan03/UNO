import type { IndexedYahtzeeSpecs } from "../model/game";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import * as _ from 'lodash/fp'

export type PendingGamesState = Readonly<IndexedYahtzeeSpecs[]>

export const game = (id: string, state: PendingGamesState): IndexedYahtzeeSpecs | undefined => _.find(_.matches({id}), state)

const init_state: PendingGamesState = []

const pending_games_reducers = {
  reset(_state: PendingGamesState, action: PayloadAction<IndexedYahtzeeSpecs[]>): PendingGamesState{
    return action.payload
  },

  upsert(state: PendingGamesState, action: PayloadAction<IndexedYahtzeeSpecs>): PendingGamesState {
    const index = _.findIndex(_.matches({id: action.payload.id}), state)
    if (index === -1)
      return _.concat(action.payload, state)
    return _.set(index, action.payload, state)
  },

  delete(state: PendingGamesState, action: PayloadAction<IndexedYahtzeeSpecs>): PendingGamesState {
    return _.remove(_.matches({id: action.payload.id}), state)
  }
}

export const pending_games_slice = createSlice({
  name: 'pending games',
  initialState: init_state,
  reducers: pending_games_reducers
})
