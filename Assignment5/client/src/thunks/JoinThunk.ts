import * as api from "../model/api";
import type { IndexedUnoSpecs } from "../model/game";

export default (game: IndexedUnoSpecs, player: string) => {
  return async () => api.join_game(game, player);
};
