import type { IndexedUnoSpecs } from "../model/game";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import * as _ from "lodash/fp";

export type PendingGamesState = Readonly<IndexedUnoSpecs[]>;

export const game = (
  id: string,
  state: PendingGamesState
): IndexedUnoSpecs | undefined => _.find(_.matches({ id }), state);

const init_state: PendingGamesState = [];

const pending_games_reducers = {
  reset(
    _state: PendingGamesState,
    action: PayloadAction<IndexedUnoSpecs[]>
  ): PendingGamesState {
    return action.payload;
  },

  upsert(
    state: PendingGamesState,
    action: PayloadAction<IndexedUnoSpecs>
  ): PendingGamesState {
    const index = _.findIndex(_.matches({ id: action.payload.id }), state);
    if (index === -1) return _.concat(state, action.payload);
    return _.set(index, action.payload, state);
  },

  delete(
    state: PendingGamesState,
    action: PayloadAction<Pick<IndexedUnoSpecs, "id">>
  ): PendingGamesState {
    return _.filter((g: IndexedUnoSpecs) => g.id !== action.payload.id, state);
  },
};

export const pending_games_slice = createSlice({
  name: "Pending games slice",
  initialState: init_state,
  reducers: pending_games_reducers,
});
