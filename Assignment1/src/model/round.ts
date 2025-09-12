import { Card } from "./card";
import { Deck } from "./deck";

export type Round = {
  catchUnoFailure(data: UnoFailureProps): void;
  playerHand(player: number): Card[];
  play(player: number): void;
  drawPile(): Deck;
  discardPile(): Deck;
  sayUno(player: number): void;
  draw(): void;
};

type UnoFailureProps = {
  accuser: number;
  accused: number;
};

export class RoundClass implements Round {
  private _drawPile: Deck;
  private _discardPile: Deck;

  constructor(drawCards: Deck, discardCard: Deck) {
    this._discardPile = discardCard;
    this._drawPile = discardCard;
  }

  drawPile(): Deck {
    return this._drawPile;
  }

  discardPile(): Deck {
    return this._discardPile;
  }

  play(player: number) {
    // TODO
  }

  catchUnoFailure(data: UnoFailureProps) {
    // TODO
  }

  playerHand(player: number) {
    return [] as Card[]; //TODO
  }

  sayUno(player: number): void {
    // TODO
  }

  draw() {
    // TODO
  }
}
