import { Uno, UnoSpecs } from "../../domain/src/model/uno";
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
  games(): Promise<ServerResponse<ActiveGame[], StoreError>>;
  game(id: string): Promise<ServerResponse<ActiveGame, StoreError>>;
  pending_games(): Promise<ServerResponse<PendingGame[], StoreError>>;
  pending_game(id: string): Promise<ServerResponse<PendingGame, StoreError>>;
}

export class ServerModel {
  private store: GameStore;
  private randomizer: Randomizer;

  constructor(store: GameStore, randomizer: Randomizer) {
    this.store = store;
    this.randomizer = randomizer;
  }

  all_games() {
    return this.store.games();
  }

  game(id: string) {
    return this.store.game(id);
  }

  all_pending_games() {
    return this.store.pending_games();
  }

  pending_game(id: string) {
    return this.store.pending_game(id);
  }
}
