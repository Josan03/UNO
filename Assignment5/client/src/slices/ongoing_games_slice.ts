import type { IndexedUno } from "../model/game";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import * as _ from "lodash/fp";

export type OngoingGamesState = Readonly<IndexedUno[]>;

export const game = (
  id: string,
  state: OngoingGamesState
): IndexedUno | undefined => _.find(_.matches({ id }), state);

const init_state: OngoingGamesState = [];

const ongoing_games_reducers = {
  reset(
    _state: OngoingGamesState,
    action: PayloadAction<IndexedUno[]>
  ): OngoingGamesState {
    return action.payload;
  },

  upsert(
    state: OngoingGamesState,
    action: PayloadAction<IndexedUno>
  ): OngoingGamesState {
    const index = _.findIndex(_.matches({ id: action.payload.id }), state);
    if (index === -1) return _.concat(state, action.payload);
    return _.set(index, action.payload, state);
  },
};

export const ongoing_games_slice = createSlice({
  name: "Ongoing games slice",
  initialState: init_state,
  reducers: ongoing_games_reducers,
});
