import { useEffect, useState } from "react";
import * as _ from 'lodash/fp'
import type { IndexedYahtzee } from "../model/game";
import { useDispatch } from "react-redux";
import RerollThunk from "../thunks/RerollThunk";
import type { Dispatch } from "../stores/store";
import './DiceRoll.css'

export default function DiceRoll({ game, player, enabled, className }: {game: IndexedYahtzee, player: string, enabled: boolean, className: string}) {
  const [held, setHeld] = useState([false, false, false, false, false])
  const dispatch: Dispatch = useDispatch()
  
  const hold = (i: number, value: boolean) => setHeld(_.set(i, value, held))

  const reroll_enabled = game && game.rolls_left > 0 && enabled

  const reroll = () => {
    const heldIndices = held.map((b, i) => b ? i : undefined).filter(i => i !== undefined)
    dispatch(RerollThunk(game, heldIndices, player))
  }

  useEffect(() => {
    setHeld([false, false, false, false, false])
  }, [enabled])

  return  <div className={`${className} dice`}>
            {!enabled && <div className="diceheader">{game.players[game.playerInTurn]} is playing</div>}
            <div className="die"></div>
            {game.roll.map((d, i) => <div className = {`die die${d}`} key={i}>{d}</div>)}
            <div className="caption">{(enabled && reroll_enabled)? 'Hold:' : ''}</div>
            {enabled && reroll_enabled && game.roll.map((_, i) => <input type="checkbox" checked={held[i]} onChange={e => hold(i, e.target.checked)} key={i}/>)}
            {enabled && reroll_enabled && <div v-if="enabled && reroll_enabled" className="reroll">
              <button onClick={reroll}>Re-roll</button>
            </div>}
          </div>
}
