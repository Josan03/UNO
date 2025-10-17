import { Randomizer } from "../../domain/src/utils/random_utils";
import { ServerResponse } from "./response";
import { GameStore, IndexedGame, PendingGame, ServerError, ServerModel } from "./servermodel";

export interface Broadcaster {
    send: (message: IndexedGame | PendingGame) => Promise<void>
}

export type API = {
    new_game: (creator: string, numberOfPlayers: number) => Promise<ServerResponse<IndexedGame | PendingGame, ServerError>>
    pending_games: () => Promise<ServerResponse<PendingGame[], ServerError>>
    pending_game: (id: string) => Promise<ServerResponse<PendingGame, ServerError>>
    join: (id: string, player: string) => Promise<ServerResponse<IndexedGame | PendingGame, ServerError>>
    games: () => Promise<ServerResponse<IndexedGame[], ServerError>>
    game: (id: string) => Promise<ServerResponse<IndexedGame, ServerError>>
}

export const create_api = (broadcaster: Broadcaster, store: GameStore, randomizer: Randomizer): API => {
    const server = new ServerModel(store, randomizer)

    async function new_game(creator: string, numberOfPlayers: number) {
        const new_game = await server.add(creator, numberOfPlayers)
        new_game.process(broadcast)
        return new_game
    }

    async function games() {
        return server.all_games()
    }

    async function game(id: string) {
        // Problem here with ID
        return server.game(id)
    }

    function pending_games() {
        return server.all_pending_games()
    }

    function pending_game(id: string) {
        return server.pending_game(id)
    }

    async function join(id: string, player: string) {
        const game = await server.join(id, player)
        game.process(broadcast)
        return game
    }

    async function broadcast(game: IndexedGame | PendingGame): Promise<void> {
        broadcaster.send(game)
    }

    return {
        new_game,
        pending_games,
        pending_game,
        join,
        games,
        game
    }
}