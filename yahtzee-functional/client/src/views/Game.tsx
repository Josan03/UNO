import { useSelector } from "react-redux"
import DiceRoll from "../components/DiceRoll"
import Page from "../components/Page"
import ScoreCard from "../components/ScoreCard"
import type { PlayerState } from "../slices/player_slice"
import type { State } from "../stores/store"
import { useNavigate, useParams } from "react-router"
import * as Ongoing from "../slices/ongoing_games_slice"
import type { IndexedYahtzee } from "../model/game"
import { is_finished, scores } from "domain/src/model/yahtzee.game"
import * as _ from 'lodash/fp'
import { useEffect } from "react"
import './Game.css'

export default function Game() {
  const params = useParams()
  const {player} = useSelector<State, PlayerState>(state => state.player)
  const id = params.id!
  const game = useSelector<State, IndexedYahtzee | undefined>(state => Ongoing.game(id, state.ongoing_games))
  const navigate = useNavigate()

  useEffect(() => {
    if (player === undefined) {
      navigate(`/login?game=${id}`)
    } else if (game === undefined) {
      navigate('/')
    }
  })

  if (player === undefined || game === undefined) return <></>

  const enabled = player === game.players[game.playerInTurn]
  const finished = is_finished(game)
  const standings = _.sortBy(_.last, scores(game).map((s, i) => [game.players[i], s]))

  return player && <Page>
    <div className="game">
      <div className="meta">
        <h1>Game #{id} </h1>
      </div>
      {game && <ScoreCard className="card" game={game} player={player} enabled={enabled}/>}
      {!finished && <DiceRoll className="roll" game={game!} player={player} enabled={enabled}/>}
      {finished && <div className="scoreboard">
        <table>
          <thead><tr><td key='player'>Player</td><td key='score'>Score</td></tr></thead>
          <tbody>
            {standings.map(row => <tr className={row[0] == player? 'current' : undefined} key={row[0]}><td key='player'>{row[0]}</td><td key='score'>{row[1]}</td></tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </Page>
}