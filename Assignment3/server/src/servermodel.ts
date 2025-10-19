import { Color } from "../../domain/src/model/card";
import { createUnoGame, Uno, UnoSpecs } from "../../domain/src/model/uno";
import { Randomizer } from "../../domain/src/utils/random_utils";
import { ServerResponse } from "./response";

export interface ActiveGame extends Uno {
    id: string;
    pending: false;
}

export type PendingGame = UnoSpecs & {
    id: string;
    pending: true;
};

export type StoreError =
    | { type: "Not Found"; key: any }
    | { type: "DB Error"; error: any };

export type ServerError = { type: "Forbidden" } | StoreError;

const Forbidden: ServerError = { type: "Forbidden" } as const;

export interface GameStore {
    games(): Promise<ServerResponse<ActiveGame[], StoreError>>
    game(id: string): Promise<ServerResponse<ActiveGame, StoreError>>
    add(game: ActiveGame): Promise<ServerResponse<ActiveGame, StoreError>>
    update(game: ActiveGame): Promise<ServerResponse<ActiveGame, StoreError>>

    pending_games(): Promise<ServerResponse<PendingGame[], StoreError>>
    pending_game(id: string): Promise<ServerResponse<PendingGame, StoreError>>;
    add_pending(game: Omit<PendingGame, 'id'>): Promise<ServerResponse<PendingGame, StoreError>>
    delete_pending(id: string): Promise<ServerResponse<null, StoreError>>
    update_pending(pending: PendingGame): Promise<ServerResponse<PendingGame, StoreError>>
}

export class ServerModel {
    private store: GameStore;
    private randomizer: Randomizer;

    constructor(store: GameStore, randomizer: Randomizer) {
        this.store = store;
        this.randomizer = randomizer;
    }

    async add(creator: string, numberOfPlayers: number) {
        const game = await this.store.add_pending({ creator, numberOfPlayers, players: [], pending: true })
        return game.flatMap(g => this.join(g.id, creator))
    }

    all_games() {
        return this.store.games();
    }

    game(id: string) {
        return this.store.game(id);
    }

    all_pending_games() {
        return this.store.pending_games()
    }

    pending_game(id: string) {
        return this.store.pending_game(id);
    }

    async join(id: string, player: string) {
        const pending_game = await this.store.pending_game(id)
        pending_game.process(async game => game.players.push(player))
        return pending_game.flatMap(g => this.startGameIfReady(g))
    }

    async play_card(id: string, playerIndex: number, cardIndex: number, namedColor: Color) {
        const game = await this.store.game(id)

        const withTurnCheck = await game.filter(
            async (g) => {
                const round = g.currentRound
                if (!round) return false
                const inTurn = round.getPlayerInTurn()
                return Number.isInteger(inTurn) && inTurn === playerIndex
            },
            async (_) => ({ type: "Forbidden" } as const)
        )

        const afterPlay = await withTurnCheck.map(async (g) => {
            try {
                g.currentRound.play(cardIndex, namedColor)
                return g
            } catch (err) {
                throw ({ type: "Forbidden" } as const)
            }
        }).catch(async (err) => {
            return ServerResponse.error(err as ServerError)
        })

        return afterPlay.flatMap(async (g) => this.store.update(g))
    }

    private startGameIfReady(pending_game: PendingGame): Promise<ServerResponse<ActiveGame | PendingGame, StoreError>> {
        const id = pending_game.id
        if (pending_game.players.length === pending_game.numberOfPlayers) {
            const game = createUnoGame(pending_game.players, 500)
            this.store.delete_pending(id)
            return this.store.add({ id, pending: false, ...game })
        } else {
            return this.store.update_pending(pending_game)
        }
    }

    private async update(id: string, player: string, processor: (game: ActiveGame) => Promise<unknown>): Promise<ServerResponse<ActiveGame, ServerError>> {
        let uno: ServerResponse<ActiveGame, ServerError> = await this.game(id)
        uno = await uno.filter(async game => game && game.currentRound.player(game.currentRound.currentPlayerIndex) === player, async _ => Forbidden)
        uno.process(processor)
        return uno.flatMap(async game => this.store.update(game))
    }
}
