import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type PlayerState =  {
  player: string | undefined
}

const init_state: PlayerState = { player: undefined }

const player_reducers = {
  login(_state: PlayerState, action: PayloadAction<string>): PlayerState {
    return { player: action.payload }
  }
}

export const player_slice = createSlice({
  name: 'player',
  initialState: init_state,
  reducers: player_reducers
})
