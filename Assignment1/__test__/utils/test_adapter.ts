import {
  createFullDeck,
  createFromMemento,
  Card,
  Deck,
} from "../../src/model/deck";
import { RoundClass } from "../../src/model/round";
import { createUnoGame, Game } from "../../src/model/uno";
import {
  Randomizer,
  Shuffler,
  standardRandomizer,
  standardShuffler,
} from "../../src/utils/random_utils";

// Fix (or import) these types:
type Round = any;

export function createInitialDeck(): Deck {
  return createFullDeck();
}

export function createDeckFromMemento(
  cards: Record<string, string | number>[]
): Deck {
  return createFromMemento(cards);
}

export type HandConfig = {
  players: string[];
  dealer: number;
  shuffler?: Shuffler<Card>;
  cardsPerPlayer?: number;
};

export function createRound({
  players,
  dealer,
  shuffler = standardShuffler,
  cardsPerPlayer = 7,
}: HandConfig): Round {
  return new RoundClass(players, dealer, shuffler, cardsPerPlayer);
}

export function createRoundFromMemento(
  memento: any,
  shuffler: Shuffler<Card> = standardShuffler
): Round {}

export type GameConfig = {
  players: string[];
  targetScore: number;
  randomizer: Randomizer;
  shuffler: Shuffler<Card>;
  cardsPerPlayer: number;
};

export function createGame(props: Partial<GameConfig>): Game {
  return createUnoGame(props.players, props.targetScore);
}

export function createGameFromMemento(
  memento: any,
  randomizer: Randomizer = standardRandomizer,
  shuffler: Shuffler<Card> = standardShuffler
): Game {}
