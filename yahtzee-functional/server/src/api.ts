import { Yahtzee } from "domain/src/model/yahtzee.game";
import { ServerResponse } from "./response";
import { IndexedYahtzee, PendingGame } from "./servermodel";
import * as Model from './servermodel'
import { SlotKey } from "domain/src/model/yahtzee.score"

export type StoreError = { type: 'Not Found', key: any } | { type: 'DB Error', error: any }

const Forbidden = { type: 'Forbidden' } as const

export type ServerError = typeof Forbidden | StoreError

export interface GameStore {
  games(): Promise<ServerResponse<IndexedYahtzee[], StoreError>>
  game(id: string): Promise<ServerResponse<IndexedYahtzee, StoreError>>
  add(game: IndexedYahtzee | Yahtzee & {id?: string}):  Promise<ServerResponse<IndexedYahtzee, StoreError>>
  update(game: IndexedYahtzee):  Promise<ServerResponse<IndexedYahtzee, StoreError>>
  
  pending_games(): Promise<ServerResponse<PendingGame[], StoreError>>
  pending_game(id: string): Promise<ServerResponse<PendingGame, StoreError>>
  add_pending(game: Omit<PendingGame, 'id'>): Promise<ServerResponse<PendingGame, StoreError>>
  delete_pending(id: string): Promise<ServerResponse<null, StoreError>>
  update_pending(pending: PendingGame): Promise<ServerResponse<PendingGame, StoreError>>
}  

export interface Broadcaster {
  send: (message: IndexedYahtzee | PendingGame) => Promise<void>
}

export type API = {
  new_game: (creator: string, number_of_players: number) => Promise<ServerResponse<IndexedYahtzee | PendingGame, ServerError>>;
  pending_games: () => Promise<ServerResponse<PendingGame[], ServerError>>;
  pending_game: (id: string) => Promise<ServerResponse<PendingGame, ServerError>>;
  join: (id: string, player: string) => Promise<ServerResponse<IndexedYahtzee | PendingGame, ServerError>>;
  games: () => Promise<ServerResponse<IndexedYahtzee[], ServerError>>;
  game: (id: string) => Promise<ServerResponse<IndexedYahtzee, ServerError>>;
  reroll: (id: string, held: number[], player: string) => Promise<ServerResponse<IndexedYahtzee, ServerError>>;
  register: (id: string, slot: SlotKey, player: string) => Promise<ServerResponse<IndexedYahtzee, ServerError>>;
}

export const create_api = (broadcaster: Broadcaster, store: GameStore): API => {
  async function add(new_game: Omit<PendingGame, 'id'> | Omit<IndexedYahtzee, 'id'>) {
    if (new_game.pending) {
      return await store.add_pending(new_game)
    } else {
      return await store.add(new_game)
    }
  }

  function validPlayer(player: string, game: IndexedYahtzee): boolean {
    return game.players[game.playerInTurn] === player
  }

  async function update(id: string, player: string, processor: (game: IndexedYahtzee) => IndexedYahtzee)
        : Promise<ServerResponse<IndexedYahtzee, ServerError>> {
    const game = await store.game(id)
    const processed = game
      .filter(g => validPlayer(player, g), _ => Forbidden)
      .map(processor)
    return processed.asyncFlatMap(game => store.update(game))
  } 

  async function new_game(creator: string, number_of_players: number) {
    const new_game = Model.create_pending(creator, number_of_players)
    const created = await add(new_game)
    created.process(broadcast)
    return created
  }
  
  async function reroll(id: string, held: number[], player: string) {
    const game = await update(id, player, game => Model.reroll(held, game))
    game.process(broadcast)
    return game
  }
  
  async function register(id: string, slot: SlotKey, player: string) {
    const game = await update(id, player, game => Model.register(slot, game))
    game.process(broadcast)
    return game
  }

  async function games() {
    return store.games()
  }

  async function game(id: string) {
    return store.game(id)
  }

  function pending_games() {
    return store.pending_games()
  }

  function pending_game(id: string) {
    return store.pending_game(id)
  }

  async function update_pending(game: PendingGame | IndexedYahtzee): Promise<ServerResponse<PendingGame | IndexedYahtzee, StoreError>> {
    if (game.pending)
      return store.update_pending(game)
    const res = await store.delete_pending(game.id)
    return res.resolve({
      onSuccess: async _ => store.add(game),
      onError: async err => ServerResponse.error(err)
    })
  }

  async function join(id: string, player: string) {
    const game = await store.pending_game(id)
    const joined = game.map(game => Model.join(player, game))
    const stored = await joined.asyncFlatMap(update_pending)
    stored.process(broadcast)
    return stored
  }
  
  async function broadcast(game: IndexedYahtzee | PendingGame): Promise<void> {
    broadcaster.send(game)
  }

  return {
    new_game,
    pending_games,
    pending_game,
    join,
    games,
    game,
    reroll,
    register,
  }
}
