import { Randomizer } from "../../domain/src/utils/random_utils";
import { ServerResponse } from "./response";
import {
  GameStore,
  ActiveGame,
  PendingGame,
  ServerError,
  ServerModel,
} from "./servermodel";

export interface Broadcaster {
  send: (message: ActiveGame | PendingGame) => Promise<void>;
}

export type API = {
    create_game: (creator: string, numberOfPlayers: number) => Promise<ServerResponse<ActiveGame | PendingGame, ServerError>>
    pending_games: () => Promise<ServerResponse<PendingGame[], ServerError>>
    pending_game: (id: string) => Promise<ServerResponse<PendingGame, ServerError>>
    join: (id: string, player: string) => Promise<ServerResponse<ActiveGame | PendingGame, ServerError>>
    games: () => Promise<ServerResponse<ActiveGame[], ServerError>>
    game: (id: string) => Promise<ServerResponse<ActiveGame, ServerError>>
}

export const create_api = (
  broadcaster: Broadcaster,
  store: GameStore,
  randomizer: Randomizer
): API => {
  const server = new ServerModel(store, randomizer);

    async function create_game(creator: string, numberOfPlayers: number) {
        const newGame = await server.add(creator, numberOfPlayers)
        newGame.process(broadcast)
        return newGame
    }

  async function games() {
    return server.all_games();
  }

  async function game(id: string) {
    return server.game(id);
  }

  function pending_games() {
    return server.all_pending_games();
  }

  function pending_game(id: string) {
    return server.pending_game(id);
  }

  async function join(id: string, player: string) {
    const game = await server.join(id, player);
    game.process(broadcast);
    return game;
  }

  async function broadcast(game: ActiveGame | PendingGame): Promise<void> {
    broadcaster.send(game);
  }

    return {
        create_game,
        pending_games,
        pending_game,
        join,
        games,
        game
    }
}