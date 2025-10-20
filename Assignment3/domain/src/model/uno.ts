import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../utils/random_utils";
import { Card } from "./card";
import { createRoundClassFromMemento, Round, RoundClass } from "./round";

export type UnoSpecs = {
  creator?: string;
  players: string[];
  numberOfPlayers?: number;
};

export type UnoOptions = UnoSpecs & {
  randomizer?: Randomizer;
};

export interface Uno {
  readonly players: string[];
  readonly targetScore: number;
  readonly playersCount: number;
  scores: number[];
  cardsPerPlayer?: number;
  currentRound?: Round;

  player(index: number): string;
  score(index: number): number;
  winner(): number | undefined;
  getCurrentRound(): Round | undefined;
  toMemento(): UnoMemento;
}

export interface UnoMemento {
  readonly players: Readonly<string[]>;
  scores: number[];
  readonly targetScore: Readonly<number>;
  readonly cardsPerPlayer?: Readonly<number>;
  currentRound?: Readonly<Round>;
}

export class UnoGame implements Uno {
  public players: string[];
  public scores: number[];
  public targetScore: number;
  public playersCount: number;
  public cardsPerPlayer?: number;
  public currentRound?: Round | undefined;
  private readonly randomizer: Randomizer;
  private readonly shuffler: Shuffler<Card>;

  constructor(
    players: string[],
    targetScore: number,
    opts?: {
      randomizer?: Randomizer;
      shuffler?: Shuffler<Card>;
      cardsPerPlayer?: number;
      startRound?: boolean;
      roundFromMemento?: any;
    }
  ) {
    if (!players || players.length < 2) {
      throw new Error("At least 2 players are required");
    }
    if (!Number.isFinite(targetScore) || targetScore <= 0) {
      throw new Error("Target score must be greater than 0");
    }

    this.players = players.slice();
    this.targetScore = targetScore;
    this.playersCount = this.players.length;
    this.scores = Array(this.players.length).fill(0);
    this.randomizer = opts?.randomizer ?? standardRandomizer;
    this.shuffler = opts?.shuffler ?? standardShuffler;
    this.cardsPerPlayer = opts?.cardsPerPlayer ?? 7;

    if (opts?.roundFromMemento) {
      this.currentRound = createRoundClassFromMemento(
        opts.roundFromMemento,
        this.shuffler
      );
      {
        const r = this.currentRound
        r.onEnd(({ winner }) => this.onRoundEnd(winner, r))
      }
    } else if (opts?.startRound !== false) {
      const dealer = Math.floor(this.randomizer(this.players.length));
      this.currentRound = new RoundClass(
        this.players,
        dealer,
        this.shuffler,
        this.cardsPerPlayer
      );
      {
        const r = this.currentRound
        r.onEnd(({ winner }) => this.onRoundEnd(winner, r))
      }
    }
  }

  get playerCount(): number {
    return this.players.length;
  }

  player(index: number): string {
    if (!Number.isInteger(index) || index < 0 || index >= this.players.length) {
      throw new Error("Player index out of bounds");
    }
    return this.players[index];
  }

  score(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= this.players.length) {
      throw new Error("Player index out of bounds");
    }
    return this.scores[index];
  }

  winner(): number | undefined {
    let winIdx: number | undefined = undefined;
    for (let i = 0; i < this.scores.length; i++) {
      if (this.scores[i] >= this.targetScore) {
        winIdx = i;
        break;
      }
    }
    return winIdx;
  }

  getCurrentRound(): Round | undefined {
    return this.currentRound;
  }

  toMemento(): UnoMemento {
    const base: UnoMemento = {
      players: this.players.slice(),
      targetScore: this.targetScore,
      scores: this.scores,
      cardsPerPlayer: this.cardsPerPlayer ?? 7,
    };

    if (this.currentRound) {
      base.currentRound = this.currentRound.toMemento();
    }

    return base as UnoMemento;
  }

  private onRoundEnd(winnerIndex: number, round: Round) {
    const gained = round.score() ?? 0;
    this.scores[winnerIndex] += gained;

    if (this.winner() !== undefined) {
      this.currentRound = undefined;
      return;
    }

    const dealer = winnerIndex;
    this.currentRound = new RoundClass(
      this.players,
      dealer,
      this.shuffler,
      this.cardsPerPlayer
    );
    this.currentRound.onEnd(({ winner }) =>
      this.onRoundEnd(winner, this.currentRound!)
    );
  }
}

export function createUnoGame(
  players?: string[],
  targetScore?: number,
  opts?: {
    randomizer?: Randomizer;
    shuffler?: Shuffler<Card>;
    cardsPerPlayer?: number;
    startRound?: boolean;
    roundFromMemento?: any;
  }
): Uno {
  const p = players ?? ["A", "B"];
  const t = targetScore ?? 500;
  return new UnoGame(p, t, { ...opts });
}

export function createUnoGameFromMemento(
  m: UnoMemento,
  opts?: { randomizer?: Randomizer; shuffler?: Shuffler<Card> }
): Uno {
  if (!Array.isArray(m.players) || m.players.length < 2) {
    throw new Error("Invalid memento: at least 2 players are required.");
  }

  if (!Number.isFinite(m.targetScore) || m.targetScore <= 0) {
    throw new Error("Invalid memento: target score must be greater than 0.");
  }

  if (!Array.isArray(m.scores) || m.scores.length !== m.players.length) {
    throw new Error(
      "Invalid memento: scores length must equal players length."
    );
  }

  if (m.scores.some((score) => !Number.isFinite(score) || score < 0)) {
    throw new Error("Invalid memento: scores must be non-negative numbers.");
  }

  const winners = m.scores
    .map((s, i) => ({ i, s }))
    .filter((x) => x.s >= m.targetScore)
    .map((x) => x.i);

  if (winners.length > 1) {
    throw new Error("Invalid memento: several winners already reached target.");
  }

  const isFinished = winners.length === 1;
  let roundFromMemento = undefined;
  let startRound = false;

  if (!isFinished) {
    if (m.currentRound) {
      roundFromMemento = m.currentRound;
    } else {
      throw new Error("Invalid memento: current round missing")
    }
  }

  const game = new UnoGame(m.players, m.targetScore, {
    randomizer: opts?.randomizer ?? standardRandomizer,
    shuffler: opts?.shuffler ?? standardShuffler,
    cardsPerPlayer: m.cardsPerPlayer ?? 7,
    startRound,
    roundFromMemento,
  });

  (game as any).scores = m.scores.slice();

  return game;
}
