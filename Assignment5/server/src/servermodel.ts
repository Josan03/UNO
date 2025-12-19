import {
  Game,
  GameProps,
  createGame,
  play as gamePlay,
} from "../../domain/src/model/uno";
import * as Round from "../../domain/src/model/round";
import { Color } from "../../domain/src/model/deck";
import * as _ from "lodash/fp";

export interface IndexedUno extends Game {
  readonly id: string;
  readonly pending: false;
}

export type PendingGame = Required<
  Pick<GameProps, "players" | "targetScore">
> & {
  readonly creator: string;
  readonly numberOfPlayers: number;
  readonly id: string;
  readonly pending: true;
};

function startGameIfReady(pending_game: PendingGame): IndexedUno | PendingGame {
  if (pending_game.players.length < pending_game.numberOfPlayers)
    return pending_game;

  const game = createGame({
    players: pending_game.players,
    targetScore: pending_game.targetScore,
  });

  return _.flow([_.set("id", pending_game.id), _.set("pending", false)])(
    game
  ) as IndexedUno;
}

export function join(
  player: string,
  pending_game: PendingGame
): PendingGame | IndexedUno {
  const joined: PendingGame = {
    ...pending_game,
    players: [...pending_game.players, player],
  };
  return startGameIfReady(joined);
}

export function create_pending(
  creator: string,
  numberOfPlayers: number,
  targetScore: number = 500
): Omit<PendingGame, "id"> | Omit<IndexedUno, "id"> {
  if (numberOfPlayers === 1) {
    const game = createGame({ players: [creator], targetScore });
    return _.set("pending", false, game) as any;
  }
  return {
    creator,
    numberOfPlayers,
    targetScore,
    players: [creator],
    pending: true,
  };
}

export function playCard(
  cardIndex: number,
  namedColor: Color | undefined,
  game: IndexedUno
): IndexedUno {
  if (!game.currentRound) {
    throw new Error("Game has ended");
  }

  const newGame = gamePlay(
    (round) => Round.play(cardIndex, namedColor, round),
    game
  );

  return { ...newGame, id: game.id, pending: false };
}

export function drawCard(game: IndexedUno): IndexedUno {
  if (!game.currentRound) {
    throw new Error("Game has ended");
  }

  const newGame = gamePlay(Round.draw, game);
  return { ...newGame, id: game.id, pending: false };
}

export function sayUno(playerIndex: number, game: IndexedUno): IndexedUno {
  if (!game.currentRound) {
    throw new Error("Game has ended");
  }

  const newGame = gamePlay((round) => Round.sayUno(playerIndex, round), game);

  return { ...newGame, id: game.id, pending: false };
}

export function callUno(
  accuser: number,
  accused: number,
  game: IndexedUno
): IndexedUno {
  if (!game.currentRound) {
    throw new Error("Game has ended");
  }

  const newGame = gamePlay(
    (round) => Round.catchUnoFailure({ accuser, accused }, round),
    game
  );

  return { ...newGame, id: game.id, pending: false };
}
