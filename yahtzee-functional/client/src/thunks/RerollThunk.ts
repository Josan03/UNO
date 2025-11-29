import { reroll } from "../model/api"
import type { IndexedYahtzee } from "../model/game"

export default (game: IndexedYahtzee, held: number[], player: string) => {
  return async () => reroll(game, held, player)
}
