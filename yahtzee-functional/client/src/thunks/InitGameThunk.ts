import type { Dispatch } from "../stores/store";
import * as api from '../model/api'
import { ongoing_games_slice } from "../slices/ongoing_games_slice";
import { pending_games_slice } from "../slices/pending_games_slice";

export default async (dispatch: Dispatch) => {
    const games = await api.games();
    dispatch(ongoing_games_slice.actions.reset(games))
    
    const pending_games = await api.pending_games();
    dispatch(pending_games_slice.actions.reset(pending_games))
}
