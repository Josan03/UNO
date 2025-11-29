import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import type { State } from '../stores/store'
import type { PlayerState } from '../slices/player_slice'
import type { OngoingGamesState } from '../slices/ongoing_games_slice'
import type { PendingGamesState } from '../slices/pending_games_slice'
import * as _ from 'lodash/fp'
import { is_finished } from 'domain/src/model/yahtzee.game'

export default function Page({children}: {children: React.ReactNode}) {
  const {player} = useSelector<State, PlayerState>(state => state.player)
  const ongoing_games = useSelector<State, OngoingGamesState>(state => state.ongoing_games)
  const pending_games = useSelector<State, PendingGamesState>(state => state.pending_games)

  const is_participant = (g: {players: readonly string[]}) => g.players.some(_.isEqual(player))

  const my_ongoing_games = ongoing_games.filter(is_participant).filter(_.negate(is_finished))
  const my_pending_games = pending_games.filter(is_participant)
  const other_pending_games = pending_games.filter(_.negate(is_participant))

  return <>
    <h2 className="subheader">Welcome player {player}</h2>
    <nav>
      <Link className='link' to="/">Lobby</Link>
      
      <h2>My Games</h2>
      <h3>Ongoing</h3>
      {my_ongoing_games.map(game => <Link className='link' to={`/game/${game.id}`} key={game.id}>Game #{game.id}</Link>)}
      
      <h3>Waiting for players</h3>
      {my_pending_games.map(game => <Link className='link' to={`/pending/${game.id}`} key={game.id}>Game #{game.id}</Link>)}
      
      <h2>Available Games</h2>
      {other_pending_games.map(game => <Link className='link' to={`/pending/${game.id}`} key={game.id}>Game #{game.id}</Link>)}
    </nav>
    
    {children}
  </>
}
