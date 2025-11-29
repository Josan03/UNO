import { die_values } from "domain/src/model/dice"
import type { IndexedYahtzee } from "../model/game"
import { lower_section_keys, slots, sum_upper, total_upper, type SlotKey } from "domain/src/model/yahtzee.score"
import { scores, slot_score } from "domain/src/model/yahtzee.game"
import { score } from "domain/src/model/yahtzee.slots"
import { useDispatch } from "react-redux"
import type { Dispatch } from "../stores/store"
import RegisterThunk from '../thunks/RegisterThunk'
import './ScoreCard.css'

export default function ScoreCard({ game, player, enabled, className }: {game: IndexedYahtzee, player: string, enabled: boolean, className: string}) {
  const dispatch: Dispatch = useDispatch()

  const players = game.players

  const playerScores = (key: SlotKey): { player: string; score: number | undefined }[] => {
    return players.map((player, i) => ({player, score: slot_score(game.scores[i], key)}))
  }

 const isActive = (p: string) => game.players[game.playerInTurn] === player && player === p

const activeClass = (p: string) => p === player? 'activeplayer' : undefined

  const potentialScore = (key: SlotKey) => score(slots[key], game.roll)

  const displayScore = (score: number | undefined): string => {
    if (score === 0)
      return '---'
    else
      return score?.toString() ?? ''
  }

  const register = (key: SlotKey) => {
    if (enabled) 
      dispatch(RegisterThunk(game, key, player))
  }

  return <div className={`${className} score`}>
      <table className="scorecard">
        <tbody>
          <tr className="section_header" key='upper section'><td colSpan={players.length + 2}>Upper Section</td></tr>
          <tr key='header'><td key='type'>Type</td><td key='target'>Target</td>{players.map(player => <td className={activeClass(player)} key={player}>{player}</td>)}</tr>
          {die_values.map(val => <tr key={val}>
            <td key='type'>{val}s</td>
            <td key='target'>{3 * val}</td>
            {playerScores(val).map(({player, score}) => <>
              {isActive(player) && score === undefined && <td className="clickable potential" onClick={() => register(val)} key={player}>{displayScore(potentialScore(val))}</td>}
              {isActive(player) && score !== undefined && <td className="activeplayer" key={player}>{displayScore(score)}</td>}
              {!isActive(player) && <td key={player}>{displayScore(score)}</td>}
            </>)}
          </tr>)}
          <tr key='sum'>
            <td key='type'>Sum</td>
            <td key='target'>63</td>
            {players.map((player, index) => <td className={activeClass(player)} key={player}>{sum_upper(game.scores[index].upper_section.scores)}</td>)}
          </tr>
          <tr key='bonus'>
            <td key='type'>Bonus</td>
            <td key='target'>50</td>
            {players.map((player, index) => <td className={activeClass(player)} key={player}>{game.scores[index].upper_section.bonus}</td>)}
          </tr>
          <tr key='ustotal'>
            <td key='type'>Total</td>
            <td key='target'></td>
            {players.map((player, index) => <td className={activeClass(player)} key={player}>{total_upper(game.scores[index].upper_section)}</td>)}
          </tr>
          <tr className="section_header"><td colSpan={players.length + 2} key='lower section'>Lower Section</td></tr>
          {lower_section_keys.map(key => <tr key={key}>
            <td key='type'>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
            <td key='target'></td>
            {playerScores(key).map(({player, score}) => <>
              {isActive(player) && score === undefined && <td className="clickable potential" onClick={() => register(key)} key={player}>{displayScore(potentialScore(key))}</td>}
              {isActive(player) && score !== undefined && <td className="activeplayer" key={player}>{displayScore(score)}</td>}
              {!isActive(player) && <td key={player}>{displayScore(score)}</td>}
            </>)}
          </tr>)}
          
          <tr key='total'>
            <td key='type'>Total</td>
            <td key='target'></td>
            {players.map((player, index) => <td className={activeClass(player)} key={player}>{scores(game)[index]}</td>)}
          </tr>
        </tbody>
      </table>
    </div>  
}