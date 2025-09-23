import { canPlayOn, hasColor } from "../utils/helpers";
import { Shuffler } from "../utils/random_utils";
import { Card, Color } from "./card";
import { ArrayDeck, buildStandardDeck, createFromMemento, Deck } from "./deck";

export type Round = {
  player(playerIndex: number): string;
  playerCount: number;
  currentPlayerIndex: number;
  dealer: number;
  playerInTurn(): number;
  catchUnoFailure(data: UnoFailureProps): boolean;
  playerHand(playerIndex: number): Card[];
  play(playerIndex: number, namedColor?: Color): Card;
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
  public playersArray: Array<RoundPlayerDetails>;
  public _drawPile: Deck;
  public _discardPile: Deck;
  public currentColor: Color | undefined;
  public currentDirection: 'clockwise' | 'counter-clockwise' = 'clockwise';
  public faceUpTop: Card | undefined;

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

    if (firstCard) {
      this.faceUpTop = firstCard;
      this.currentColor = firstCard.color
      this.actionBasedOnFirstCard(firstCard)
    }
  }

  play(cardIndex: number, namedColor?: Color): Card {
    const hand = this.playersArray[this.currentPlayerIndex].cards

    if (hand.length === 0) throw new Error("Illegal move: hand is empty")
    if (cardIndex < 0 || cardIndex >= hand.length)
      throw new Error("Illegal move: card index out of bounds")

    const card = hand[cardIndex]

    if (namedColor && card.type !== "WILD" && card.type !== "WILD DRAW") {
      throw new Error("Illegal move: cannot name a color on a colored card");
    }

    if ((card.type === "WILD" || card.type === "WILD DRAW") && !namedColor) {
      throw new Error("Illegal move: wild must choose a color")
    }

    const effectiveColor: Color | undefined =
      card.type === "WILD" || card.type === "WILD DRAW" ? namedColor : this.currentColor

    if (!this.isAllowedToPlayCard(card, effectiveColor)) {
      throw new Error("Illegal move: cannot play this card")
    }

    hand.splice(cardIndex, 1)
    this._discardPile.addTop(card)
    this.faceUpTop = card;
    this.applyCardEffectsInPlay(card, namedColor)

    return card
  }

  canPlay(playerIndex: number) {
    const n = this.playerCount;
    const targetIndex = (((this.currentPlayerIndex + playerIndex) % n) + n) % n;

    const hand = this.playersArray[targetIndex].cards;
    return hand.some((card) => {
      const color =
        card.type === "WILD" || card.type === "WILD DRAW" ? undefined : this.currentColor;
      return this.isAllowedToPlayCard(card, color);
    });
  }

  canPlayAny(): boolean {
    const hand = this.playersArray[this.currentPlayerIndex].cards
    return hand.some((card) => {
      const color =
        card.type === "WILD" || card.type === "WILD DRAW" ? undefined : this.currentColor
      return this.isAllowedToPlayCard(card, color)
    });
  }

  player(playerIndex: number) {
    if (playerIndex < 0 || playerIndex >= this.playerCount)
      throw new Error("Player index out of bounds")
    return this.playersArray[playerIndex].name
  }

  drawPile(): Deck {
    return this._drawPile
  }

  discardPile(): Deck {
    return this._discardPile
  }

  catchUnoFailure(data: UnoFailureProps): boolean {
    if (!this.playersArray[data.accused].saidUno) return false
    if (this.playersArray[data.accused].cards.length === 1) return false

    for (let i = 0; i < 4; i++) {
      const newCard = this._drawPile.top()
      if (newCard !== undefined) this.playersArray[data.accused].cards.push(newCard)
    }
    return true
  }

  playerHand(player: number) {
    return this.playersArray[player].cards
  }

  sayUno(player: number): void {
    this.playersArray[player].saidUno = true
  }

  draw(): void {
    if (this._drawPile.size === 0) this.replenishDrawPile()

    const taken = this._drawPile.draw(1)
    if (!taken || taken.length === 0) {
      throw new Error("No cards left to draw")
    }

    const card = taken[0]
    const hand = this.playersArray[this.currentPlayerIndex].cards

    hand.push(card)

    if (this._drawPile.size === 0) this.replenishDrawPile();

    if (!this.isAllowedToPlayCard(card, this.currentColor)) {
      this.nextPlayer(1)
    }
  }

  playerInTurn(): number {
    return this.currentPlayerIndex;
  }

  private flipDirection(): void {
    this.currentDirection =
      this.currentDirection === "clockwise"
        ? "counter-clockwise"
        : "clockwise";
  }

  private replenishDrawPile(): void {
    if (!this.faceUpTop) {
      throw new Error("Cannot replenish draw pile: no face-up discard")
    }

    const currentTop = this._discardPile.peek();
    const rest: Card[] = (this._discardPile.toMemento() as Card[]).slice();

    if (currentTop && this.cardsEqual(currentTop, this.faceUpTop)) {
      rest.shift();
    }

    this._discardPile = new ArrayDeck([this.faceUpTop]);
    this._drawPile = new ArrayDeck(rest);
    if (this.shuffler) this._drawPile.shuffle(this.shuffler);
  }

  private cardsEqual(a: Card, b: Card): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
      case "NUMBERED":
        return b.type === "NUMBERED" && a.color === b.color && a.number === b.number;
      case "DRAW":
        return (b.type === "SKIP" || b.type === "REVERSE" || b.type === "DRAW") &&
          a.type === b.type && a.color === (b as any).color;
      case "SKIP":
      case "REVERSE":
      case "WILD":
      case "WILD DRAW":
        return true;
    }
  }

  private applyCardEffectsInPlay(card: Card, namedColor?: Color): void {
    if (card.type === "WILD" || card.type === "WILD DRAW") {
      if (!namedColor) throw new Error("Illegal move: wild must choose a color")
      this.currentColor = namedColor
    } else {
      this.currentColor = (card as any).color
    }

    switch (card.type) {
      case "REVERSE":
        if (this.playerCount === 2) {
          this.nextPlayer(2)
        } else {
          this.flipDirection()
          this.nextPlayer(1)
        }
        break
      case "SKIP":
        this.nextPlayer(2)
        break
      case "DRAW": {
        const next = this.peekNextIndex(1)
        this.drawNToPlayer(next, 2)
        this.nextPlayer(2)
        break
      }
      case "WILD":
        this.nextPlayer(1)
        break
      case "WILD DRAW": {
        const next = this.peekNextIndex(1)
        this.drawNToPlayer(next, 4)
        this.nextPlayer(2)
        break
      }
      case "NUMBERED":
      default:
        this.nextPlayer(1)
        break
    }
  }

  private peekNextIndex(steps: number = 1): number {
    const n = this.playersArray.length;
    const delta = this.currentDirection === "clockwise" ? steps : -steps;
    return (((this.currentPlayerIndex + delta) % n) + n) % n;
  }

  private nextPlayer(steps: number = 1): void {
    this.currentPlayerIndex = this.peekNextIndex(steps);
  }

  private actionBasedOnFirstCard(firstCard: Card): void {
    switch (firstCard.type) {
      case "REVERSE":
        this.flipDirection();
        this.nextPlayer(1);
        break;
      case "SKIP":
        this.nextPlayer(2);
        break;
      case "DRAW": {
        const drawn = this._drawPile.draw(2) ?? [];
        for (const c of drawn)
          this.playersArray[this.currentPlayerIndex].cards.push(c);
        this.nextPlayer(1);
        break;
      }
      default:
        break;
    }
  }

  private isAllowedToPlayCard(card: Card, color?: Color): boolean {
    const top = this._discardPile.peek();
    return canPlayOn(card, top, color);
  }

  private drawNToPlayer(targetIndex: number, count: number): void {
    let remaining = count;
    while (remaining > 0) {
      if (this._drawPile.size === 0) {
        this.replenishDrawPile();
      }
      const taken = this._drawPile.draw(1);
      if (!taken || taken.length === 0) {
        throw new Error("No cards left to draw");
      }
      this.playersArray[targetIndex].cards.push(taken[0]);
      remaining--;
    }
  }
}

export function createRoundClassFromMemento(memento: any, shuffler: Shuffler<Card>): Round {
  const blank = new RoundClass(
    memento.players ?? [],
    memento.dealer ?? 0,
    undefined,
    0
  )

  const playersArray = (memento.players ?? []).map((name: string, index: number) => ({
    name,
    index,
    cards: (memento.hands?.[index] ?? []) as Card[],
    saidUno: false,
  }))

  blank.playersArray = playersArray
  blank.playerCount = playersArray.length
  blank.currentPlayerIndex = memento.playerInTurn ?? 0
  blank.dealer = memento.dealer ?? 0
  blank.currentDirection = memento.currentDirection ?? "clockwise"

  blank._drawPile = createFromMemento(memento.drawPile ?? [])
  blank._discardPile = createFromMemento(memento.discardPile ?? [])

  const initialTop = blank._discardPile.peek() as Card | undefined
  blank.faceUpTop = initialTop

  if (memento.currentColor !== "undefined") {
    blank.currentColor = memento.currentColor
  } else {
    const top = blank._discardPile.peek()
    blank.currentColor = top && hasColor(top) ? top.color : undefined
  }

  blank.shuffler = shuffler

  return blank;
}