import { Yahtzee } from "domain/src/model/yahtzee.game"
import { ServerResponse } from "./response"
import { IndexedYahtzee, PendingGame } from "./servermodel"
import { GameStore, StoreError } from "./api"

const not_found = (key: any): StoreError => ({ type: 'Not Found', key })

export class MemoryStore implements GameStore {
  private _games: IndexedYahtzee[]
  private _pending_games: PendingGame[]
  private next_id: number = 1

  constructor(...games: IndexedYahtzee[]) {
    this._games = [...games]
    this._pending_games = []
  }

  async games() {
    return ServerResponse.ok([...this._games])
  }
  
  async game(id: string): Promise<ServerResponse<IndexedYahtzee, StoreError>> {
    const found = ServerResponse.ok(this._games.find(g => g.id === id))
    const game = found.filter(g => g !== undefined, _ => not_found(id))
    return game.map(g => g!)
  }

  async add(game: IndexedYahtzee | Yahtzee & {id?: string}) {
    if (game.id === undefined) {
      const id = this.next_id ++
      const indexedGame: IndexedYahtzee = {...game, id: id.toString(), pending: false}
      this._games.push(indexedGame)
      return ServerResponse.ok(indexedGame)
    }
    this._games.push(game as IndexedYahtzee)
    return ServerResponse.ok(game as IndexedYahtzee)
  }

  async update(game: IndexedYahtzee) {
    const index = this._games.findIndex(g => g.id === game.id)
    if (index === -1) {
      return ServerResponse.error(not_found(index))
    }
    this._games[index] = game
    return ServerResponse.ok(game)
  }

  async pending_games() {
    return ServerResponse.ok([...this._pending_games])
  }

  async pending_game(id: string) {
    const found = await ServerResponse.ok(this._pending_games.find(g => g.id === id))
    const game = await found.filter(g => g !== undefined, _ => not_found(id))
    return game.map(g => g!)
  }

  async add_pending(game: Omit<PendingGame, 'id'>) {
    const id = this.next_id++;
    const pending_game: PendingGame = { ...game, id: id.toString() }
    this._pending_games.push(pending_game)
    return ServerResponse.ok(pending_game)
  }

  async delete_pending(id: string): Promise<ServerResponse<null, StoreError>> {
    const index = this._pending_games.findIndex(g => g.id === id)
    if (index !== -1) {
      this._pending_games.splice(index, 1)
    }
    return ServerResponse.ok(null)
  }

  async update_pending(pending: PendingGame): Promise<ServerResponse<PendingGame, StoreError>> {
    const index = this._pending_games.findIndex(g => g.id === pending.id)
    if (index === -1) {
      return ServerResponse.error(not_found(pending.id))
    }
    this._pending_games[index] = pending
    return ServerResponse.ok(pending)
  }
}