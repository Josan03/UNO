import * as api from "../model/api";
import { pending_games_slice } from "../slices/pending_games_slice";
import type { Dispatch } from "../stores/store";
import { map } from "rxjs";

export default async (dispatch: Dispatch) => {
  const games = await api.pendingRxJS();
  games.pipe(map(pending_games_slice.actions.upsert)).subscribe(dispatch);
};
