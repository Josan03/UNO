import { map } from 'rxjs'
import * as api from '../model/api'
import { pending_games_slice } from '../slices/pending_games_slice'
import type { Dispatch } from '../stores/store'

export default async (dispatch: Dispatch) => {
  (await api.pendingRxJS()).pipe(
    map(pending_games_slice.actions.upsert)
  ).subscribe(dispatch)
}
