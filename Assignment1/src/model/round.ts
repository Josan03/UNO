import { canPlayOn, hasColor } from "../utils/helpers";
import { Shuffler } from "../utils/random_utils";
import { Card, Color, Numbered, Wild } from "./card";
import { ArrayDeck, buildStandardDeck, createFullDeck, Deck } from "./deck";

export type Round = {
  player(playerIndex: number): string;
  playerCount: number;
  currentPlayerIndex: number;
  dealer: number;
  playerInTurn(): number;
  catchUnoFailure(data: UnoFailureProps): boolean;
  playerHand(playerIndex: number): Card[];
  play(playerIndex: number, color?: Color): Card;
  canPlay(playerIndex: number): boolean;
  canPlayAny(): boolean;
  drawPile(): Deck;
  discardPile(): Deck;
  sayUno(playerIndex: number): void;
  draw(): void;
};

type UnoFailureProps = {
  accuser: number;
  accused: number;
};

type RoundPlayerDetails = {
  name: string;
  index: number;
  cards: Card[];
  saidUno: boolean;
};

export class RoundClass implements Round {
  public players: string[];
  public dealer: number;
  public shuffler?: Shuffler<Card>;
  public cardsPerPlayer: number;
  public playerCount: number;
  public currentPlayerIndex: number;
  private direction: 1 | -1 = 1; // +1 clockwise, -1 counter-clockwise
  private playersArray: Array<RoundPlayerDetails>;
  private _drawPile: Deck;
  private _discardPile: Deck;

  constructor(
    players: string[],
    dealer: number,
    shuffler?: Shuffler<Card>,
    cardsPerPlayer?: number
  ) {
    this.players = players;
    this.dealer = dealer;
    this.shuffler = shuffler;
    this.cardsPerPlayer = cardsPerPlayer ?? 7;

    // Create the Deck cards
    const fullUnoDeckCards = buildStandardDeck(); // Card[]
    if (shuffler) {
      shuffler(fullUnoDeckCards); // shuffles the array in place
    }
    this._drawPile = new ArrayDeck(fullUnoDeckCards);

    // Create Players
    this.playersArray = [];
    if (players.length > 10 || players.length < 2) {
      throw new Error("Player index out of bounds");
    } else {
      players.map((item, itemIndex) => {
        const playerCards = this._drawPile.draw(this.cardsPerPlayer);

        const roundPlayerDetails: RoundPlayerDetails = {
          name: item,
          index: itemIndex,
          cards: playerCards ? playerCards : [],
          saidUno: false,
        };
        this.playersArray.push(roundPlayerDetails);
      });
    }
    this.playerCount = this.playersArray.length;
    this.currentPlayerIndex =
      dealer < this.playersArray.length - 1 ? dealer + 1 : 0;

    //Create the Discard Pile
    let firstCard = this._drawPile.draw(1)?.[0];
    while (firstCard?.type == "WILD" || firstCard?.type == "WILD DRAW") {
      if (shuffler) this._drawPile.shuffle(shuffler);
      firstCard = this._drawPile.draw(1)?.[0];
    }
    this._discardPile = firstCard
      ? new ArrayDeck([firstCard])
      : new ArrayDeck([]);

    if (firstCard) this.actionBasedOnFirstCard(firstCard);
  }

  play(cardIndex: number, color?: Color): Card {
    const hand = this.playersArray[this.currentPlayerIndex].cards;

    if (hand.length > 0) {
      if (cardIndex < 0 || cardIndex >= hand.length) {
        throw new Error("Illegal move: card index out of bounds");
      }

      const card = hand[cardIndex];
      if (!this.isAllowedToPlayCard(card, color)) {
        throw new Error("Illegal move: cannot play this card");
      }

      hand.splice(cardIndex, 1);
      this._discardPile.addTop(card);

      this.applyCardEffectsInPlay(card);

      return card;
    }
    else
      throw new Error("Illegal move: hand is empty");
  }

  canPlay(playerIndex: number) {
    return true;
  }

  canPlayAny(): boolean {
    return true;
  }

  player(playerIndex: number) {
    if (playerIndex < 0 || playerIndex >= this.playerCount)
      throw new Error("Player index out of bounds");
    return this.playersArray[playerIndex].name;
  }

  drawPile(): Deck {
    return this._drawPile;
  }

  discardPile(): Deck {
    return this._discardPile;
  }

  catchUnoFailure(data: UnoFailureProps): boolean {
    if (!this.playersArray[data.accused].saidUno) {
      return false;
    }
    else {
      if (this.playersArray[data.accused].cards.length === 1) return false;
      else {
        for (let i = 0; i < 4; i++) {
          const newCard = this._drawPile.top();
          if (newCard !== undefined)
            this.playersArray[data.accused].cards.push(newCard);
        }
        return true;
      }
    }
  }

  playerHand(player: number) {
    return this.playersArray[player].cards;
  }

  sayUno(player: number): void {
    console.log(`${this.playersArray[player].name} said UNO`);
    this.playersArray[player].saidUno = true;
  }

  draw(): void {
    const newCard = this._drawPile.top();
    if (newCard !== undefined) {
      this.playersArray[this.currentPlayerIndex].cards.push(newCard);
      this.nextPlayer();
    }
  }

  playerInTurn(): number {
    return this.currentPlayerIndex;
  }

  private applyCardEffectsInPlay(card: Card): void {
    switch (card.type) {
      case "REVERSE":
        this.direction = this.direction === 1 ? -1 : 1;
        this.nextPlayer(1);
        break;
      case "SKIP":
        this.nextPlayer(2);
        break;
      case "DRAW": {
        const next = this.peekNextIndex(1);
        const drawn = this._drawPile.draw(2) ?? [];
        for (const c of drawn) this.playersArray[next].cards.push(c);
        this.nextPlayer(2);
        break;
      }
      case "WILD":
        this.nextPlayer(1);
        break;
      case "WILD DRAW": {
        const next = this.peekNextIndex(1);
        const drawn = this._drawPile.draw(4) ?? [];
        for (const c of drawn) this.playersArray[next].cards.push(c);
        this.nextPlayer(2);
        break;
      }
      case "NUMBERED":
      default:
        this.nextPlayer(1);
        break;
    }
  }

  private peekNextIndex(steps: number = 1): number {
    const n = this.playersArray.length;
    const delta = this.direction * steps;
    return ((this.currentPlayerIndex + delta) % n + n) % n;
  }

  private nextPlayer(steps: number = 1): void {
    const n = this.playersArray.length;
    const delta = this.direction * steps;
    this.currentPlayerIndex = ((this.currentPlayerIndex + delta) % n + n) % n;
  }

  private actionBasedOnFirstCard(firstCard: Card): void {
    switch (firstCard.type) {
      case "REVERSE":
        this.direction = this.direction === 1 ? -1 : 1;
        this.nextPlayer(1);
        break;
      case "SKIP":
        this.nextPlayer(2);
        break;
      case "DRAW": {
        const drawn = this._drawPile.draw(2) ?? [];
        for (const c of drawn) this.playersArray[this.currentPlayerIndex].cards.push(c);
        this.nextPlayer(1);
        break;
      }
      default:
        // no extra effect
        break;
    }
  }

  private isAllowedToPlayCard(card: Card, color?: Color): boolean {
    const top = this._discardPile.peek();
    return canPlayOn(card, top, color);
  }
}
