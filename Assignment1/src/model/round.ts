import { Shuffler } from "../utils/random_utils";
import { Card, Color } from "./card";
import { ArrayDeck, buildStandardDeck, createFullDeck, Deck } from "./deck";

export type Round = {
  player(playerIndex: number): string;
  playerCount: number;
  currentPlayerIndex: number;
  dealer: number;
  playerInTurn(): number;
  catchUnoFailure(data: UnoFailureProps): boolean;
  playerHand(playerIndex: number): Card[];
  play(playerIndex: number, color?: Color): void;
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
  private playersArray: Array<RoundPlayerDetails>;
  private _drawPile: Deck;
  private _discardPile: Deck;
  public playerCount: number;
  public currentPlayerIndex: number;

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

  play(playerIndex: number, color?: Color) {
    //
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
    // Nu o spus UNO
    if (!this.playersArray[data.accused].saidUno) {
      return false;
    }
    // O spus UNO
    else {
      // Are o carte?
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

  private nextPlayer(): void {
    const countIndex = this.playersArray.length - 1;
    if (this.currentPlayerIndex === countIndex) this.currentPlayerIndex = 0;
    else this.currentPlayerIndex++;
  }

  private actionBasedOnFirstCard(firstCard: Card): void {
    if (firstCard?.type == "REVERSE") {
      this.currentPlayerIndex =
        this.dealer > 0 ? this.dealer - 1 : this.playersArray.length - 1;
    }

    if (firstCard.type == "SKIP") {
      if (this.dealer < this.playersArray.length - 2) {
        this.currentPlayerIndex = this.dealer + 2;
      } else if (this.dealer == this.playersArray.length - 2) {
        this.currentPlayerIndex = 0;
      } else if (this.dealer == this.playersArray.length - 1) {
        this.currentPlayerIndex = 1;
      }
    }

    if (firstCard.type == "DRAW") {
      const newCads: Card[] | undefined = this._drawPile.draw(2);

      if (newCads) {
        this.playersArray[this.currentPlayerIndex].cards.push(newCads[0]);
        this.playersArray[this.currentPlayerIndex].cards.push(newCads[1]);
      }
    }
  }
}
