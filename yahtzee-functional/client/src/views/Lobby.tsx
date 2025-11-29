import { useDispatch, useSelector } from 'react-redux'
import Page from '../components/Page'
import type { PlayerState } from '../slices/player_slice'
import type { Dispatch, State } from '../stores/store'
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import NewGameThunk from '../thunks/NewGameThunk'

export default function Lobby() {
  const {player} = useSelector<State, PlayerState>(state => state.player)
  const dispatch: Dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (player === undefined) {
      navigate("/login")
    }
  })


  const [number_of_players, set_number_of_players] = useState(2)

  const new_game = (player: string) => {
    if (player !== undefined)
      dispatch(NewGameThunk(number_of_players, player, navigate))
  }

  return player && <Page>
    <main>
      Number of players: <input min="1" type="number" value={number_of_players} onChange={e => set_number_of_players(parseInt(e.target.value))}/>
      <button onClick={() => new_game(player)}>New Game</button>
    </main>
  </Page>
}
