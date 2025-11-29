import { filter, map } from 'rxjs'
import * as api from '../model/api'
import { ongoing_games_slice } from '../slices/ongoing_games_slice'
import { pending_games_slice, game as pending_game } from '../slices/pending_games_slice'
import type { Dispatch, GetState } from '../stores/store'

export default async (dispatch: Dispatch, getState: GetState) => {
  const games = await api.gameRxJS()
  games.pipe(
    map(game => (pending_game(game.id, getState().pending_games))),
    filter(game => undefined !== game),
    map(pending_games_slice.actions.delete)
  ).subscribe(dispatch)

  games.pipe(
    map(ongoing_games_slice.actions.upsert)
  ).subscribe(dispatch)
}
