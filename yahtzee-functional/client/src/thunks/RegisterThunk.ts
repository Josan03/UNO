import type { SlotKey } from "domain/src/model/yahtzee.score"
import { register } from "../model/api"
import type { IndexedYahtzee } from "../model/game"

export default (game: IndexedYahtzee, slot: SlotKey, player: string) => {
  return async () => register(game, slot, player)
}