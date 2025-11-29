import { join } from "../model/api";
import type { IndexedYahtzeeSpecs } from "../model/game";

export default (game: IndexedYahtzeeSpecs, player: string) => async () => join(game, player)
