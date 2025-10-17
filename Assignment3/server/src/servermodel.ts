import * as Game from "../../domain/src/model/uno";
import { Randomizer } from "../../domain/src/utils/random_utils";
import { ServerResponse } from "./response";

export interface IndexedGame extends Game.Game {
  readonly id: string;
  readonly pending: false;
}

export type PendingGame = {
  readonly id: string;
  readonly pending: true;
  creator?: string;
  players: string[];
  numberOfPlayers?: number;
};

export type StoreError =
  | { type: "Not Found"; key: any }
  | { type: "DB Error"; error: any };

export type ServerError = { type: "Forbidden" } | StoreError;

const Forbidden: ServerError = { type: "Forbidden" } as const;

export interface GameStore {
  games(): Promise<ServerResponse<IndexedGame[], StoreError>>;
  game(id: string): Promise<ServerResponse<IndexedGame, StoreError>>;
  add(game: IndexedGame): Promise<ServerResponse<IndexedGame, StoreError>>;
  update(game: IndexedGame): Promise<ServerResponse<IndexedGame, StoreError>>;

  pending_games(): Promise<ServerResponse<PendingGame[], StoreError>>;
  pending_game(id: string): Promise<ServerResponse<PendingGame, StoreError>>;
  add_pending(
    game: Omit<PendingGame, "id">
  ): Promise<ServerResponse<PendingGame, StoreError>>;
  delete_pending(id: string): Promise<ServerResponse<null, StoreError>>;
  update_pending(
    pending: PendingGame
  ): Promise<ServerResponse<PendingGame, StoreError>>;
}

export class ServerModel {
  private gameStore: GameStore;
  private randomizer: Randomizer;

  constructor(gameStore: GameStore, randomizer: Randomizer) {
    this.gameStore = gameStore;
    this.randomizer = randomizer;
  }

  all_games() {
    return this.gameStore.games();
  }

  all_pending_games() {
    return this.gameStore.pending_games();
  }

  game(id: string) {
    return this.gameStore.game(id);
  }

  pending_game(id: string) {
    return this.gameStore.pending_game(id);
  }

  async add(creator: string, numberOfPlayers: number) {
    const g = await this.gameStore.add_pending({
      creator,
      numberOfPlayers,
      players: [],
      pending: true,
    });
    return g.flatMap((game) => this.join(game.id, creator));
  }

  async join(id: string, player: string) {
    const pending_game = await this.gameStore.pending_game(id);
    pending_game.process(async (game) => game.players.push(player));
    return pending_game.flatMap((g) => this.startGameIfReady(g));
  }

  private startGameIfReady(
    pending_game: PendingGame
  ): Promise<ServerResponse<IndexedGame | PendingGame, StoreError>> {
    const id = pending_game.id;
    if (pending_game.players.length === pending_game.numberOfPlayers) {
      const game = Game.createUnoGame(pending_game.players, 500, {
        randomizer: this.randomizer,
        startRound: true,
      });
      this.gameStore.delete_pending(id);
      return this.gameStore.add({ ...game, id, pending: false });
    } else {
      return this.gameStore.update_pending(pending_game);
    }
  }

  register(
    id: string,
    player: string
  ): Promise<ServerResponse<IndexedGame, ServerError>> {
    return this.update(id, player, async (game) => {
      // TODO : Create Register functionality
    }); //game.register(slot));
  }

  private async update(
    id: string,
    player: string,
    processor: (game: IndexedGame) => Promise<unknown>
  ): Promise<ServerResponse<IndexedGame, ServerError>> {
    let uno: ServerResponse<IndexedGame, ServerError> = await this.game(id);
    uno = await uno.filter(
      async (game) => {
        if (!game) return false;
        const round = game.currentRound();
        return round?.player(round.currentPlayerIndex) === player;
      },
      async (_) => Forbidden
    );
    uno.process(processor);
    return uno.flatMap(async (game) => this.gameStore.update(game));
  }
}
