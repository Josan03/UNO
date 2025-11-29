import type { NavigateFunction } from "react-router";
import { create_game } from "../model/api";

export default (
  number_of_players: number,
  player: string,
  navigate: NavigateFunction
) => {
  return async () => {
    const game = await create_game(number_of_players, player);
    navigate(`/pending/${game.id}`);
  };
};
