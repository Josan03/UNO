import * as api from "../model/api";
import type { IndexedUnoSpecs } from "../model/game";
import type { NavigateFunction } from "react-router";

export default (
  game: IndexedUnoSpecs,
  player: string,
  navigate?: NavigateFunction
) => {
  return async () => {
    try {
      const result = await api.join_game(game, player);
      // If the game is now active (not pending), navigate to the game
      if (!result.pending && navigate) {
        navigate(`/game/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to join game:", error);
      alert("Failed to join game. Please try again.");
    }
  };
};
