import { ServerResponse } from "./response";
import { IndexedUno, PendingGame } from "./servermodel";
import * as Model from "./servermodel";
import { Color } from "../../domain/src/model/deck";

export type StoreError =
  | { type: "Not Found"; key: any }
  | { type: "DB Error"; error: any };

const Forbidden = { type: "Forbidden" } as const;

export type ServerError = typeof Forbidden | StoreError;

export interface GameStore {
  games(): Promise<ServerResponse<IndexedUno[], StoreError>>;
  game(id: string): Promise<ServerResponse<IndexedUno, StoreError>>;
  add(
    game: IndexedUno | Omit<IndexedUno, "id">
  ): Promise<ServerResponse<IndexedUno, StoreError>>;
  update(game: IndexedUno): Promise<ServerResponse<IndexedUno, StoreError>>;

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

export interface Broadcaster {
  send: (message: IndexedUno | PendingGame) => Promise<void>;
}

export type API = {
  create_game: (
    creator: string,
    numberOfPlayers: number,
    targetScore?: number
  ) => Promise<ServerResponse<IndexedUno | PendingGame, ServerError>>;
  pending_games: () => Promise<ServerResponse<PendingGame[], ServerError>>;
  pending_game: (
    id: string
  ) => Promise<ServerResponse<PendingGame, ServerError>>;
  join_game: (
    id: string,
    player: string
  ) => Promise<ServerResponse<IndexedUno | PendingGame, ServerError>>;
  games: () => Promise<ServerResponse<IndexedUno[], ServerError>>;
  game: (id: string) => Promise<ServerResponse<IndexedUno, ServerError>>;
  play_card: (
    id: string,
    playerIndex: number,
    cardIndex: number,
    namedColor: Color | undefined
  ) => Promise<ServerResponse<IndexedUno, ServerError>>;
  draw_card: (
    id: string,
    playerIndex: number
  ) => Promise<ServerResponse<IndexedUno, ServerError>>;
  say_uno: (
    id: string,
    playerIndex: number
  ) => Promise<ServerResponse<IndexedUno, ServerError>>;
  call_uno: (
    id: string,
    accuserIndex: number,
    accusedIndex: number
  ) => Promise<ServerResponse<IndexedUno, ServerError>>;
};

export const create_api = (broadcaster: Broadcaster, store: GameStore): API => {
  async function add(
    new_game: Omit<PendingGame, "id"> | Omit<IndexedUno, "id">
  ) {
    if (new_game.pending) {
      return await store.add_pending(new_game);
    } else {
      return await store.add(new_game);
    }
  }

  function validPlayer(playerIndex: number, game: IndexedUno): boolean {
    if (!game.currentRound) return false;
    return game.currentRound.playerInTurn === playerIndex;
  }

  async function update(
    id: string,
    playerIndex: number,
    processor: (game: IndexedUno) => IndexedUno
  ): Promise<ServerResponse<IndexedUno, ServerError>> {
    const game = await store.game(id);
    const processed = game
      .filter(
        (g) => validPlayer(playerIndex, g),
        (_) => Forbidden
      )
      .map(processor);
    return processed.asyncFlatMap((game) => store.update(game));
  }

  async function create_game(
    creator: string,
    numberOfPlayers: number,
    targetScore: number = 500
  ) {
    const new_game = Model.create_pending(
      creator,
      numberOfPlayers,
      targetScore
    );
    const created = await add(new_game);
    created.process(broadcast);
    return created;
  }

  async function play_card(
    id: string,
    playerIndex: number,
    cardIndex: number,
    namedColor: Color | undefined
  ) {
    const game = await update(id, playerIndex, (game) =>
      Model.playCard(cardIndex, namedColor, game)
    );
    game.process(broadcast);
    return game;
  }

  async function draw_card(id: string, playerIndex: number) {
    const game = await update(id, playerIndex, (game) => Model.drawCard(game));
    game.process(broadcast);
    return game;
  }

  async function say_uno(id: string, playerIndex: number) {
    const game = await update(id, playerIndex, (game) =>
      Model.sayUno(playerIndex, game)
    );
    game.process(broadcast);
    return game;
  }

  async function call_uno(
    id: string,
    accuserIndex: number,
    accusedIndex: number
  ) {
    const gameResponse = await store.game(id);
    const processed = gameResponse.map((game) =>
      Model.callUno(accuserIndex, accusedIndex, game)
    );
    const updated = await processed.asyncFlatMap((game) => store.update(game));
    updated.process(broadcast);
    return updated;
  }

  async function games() {
    return store.games();
  }

  async function game(id: string) {
    return store.game(id);
  }

  function pending_games() {
    return store.pending_games();
  }

  function pending_game(id: string) {
    return store.pending_game(id);
  }

  async function update_pending(
    game: PendingGame | IndexedUno
  ): Promise<ServerResponse<PendingGame | IndexedUno, StoreError>> {
    if (game.pending) return store.update_pending(game);
    const res = await store.delete_pending(game.id);
    return res.resolve({
      onSuccess: async (_) => store.add(game),
      onError: async (err) => ServerResponse.error(err),
    });
  }

  async function join_game(id: string, player: string) {
    const game = await store.pending_game(id);
    const joined = game.map((game) => Model.join(player, game));
    const stored = await joined.asyncFlatMap(update_pending);
    stored.process(broadcast);
    return stored;
  }

  async function broadcast(game: IndexedUno | PendingGame): Promise<void> {
    broadcaster.send(game);
  }

  return {
    create_game,
    pending_games,
    pending_game,
    join_game,
    games,
    game,
    play_card,
    draw_card,
    say_uno,
    call_uno,
  };
};
