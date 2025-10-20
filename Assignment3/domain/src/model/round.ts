import { canPlayOn, hasColor } from "../utils/helpers";
import { Shuffler } from "../utils/random_utils";
import { Card, Color } from "./card";
import { ArrayDeck, buildStandardDeck, createFromMemento, Deck } from "./deck";

export interface Round {
  players: string[];
  hands: Card[][];
  drawPile: Deck;
  discardPile: Deck;
  currentColor: Color | undefined;
  currentDirection: Direction;
  dealer: number;
  playerCount: number;
  currentPlayerIndex: number;

  player(playerIndex: number): string;
  getPlayerInTurn(): number | undefined;
  draw(): void;
  play(playerIndex: number, namedColor?: Color): Card;

  canPlay(playerIndex: number): boolean;
  canPlayAny(): boolean;
  pass(): void;
  playerHand(playerIndex: number): Card[];
  getDrawPile(): Deck;
  getDiscardPile(): Deck;

  sayUno(playerIndex: number): void;
  catchUnoFailure(data: UnoFailureProps): boolean;

  hasEnded(): boolean;
  winner(): number | undefined;
  score(): number | undefined;
  onEnd(callback: (e: { winner: number }) => void): void;

  toMemento(): any;
};

type UnoFailureProps = {
  accuser: number;
  accused: number;
};

export type Direction =
  | "clockwise"
  | "counterclockwise"

type UnoState =
  | { status: "idle" }
  | {
    status: "pending"
    accused: number
    closesWhenTurn: number
    satisfied: boolean
    applied: boolean
  }

export class RoundClass implements Round {
  public players: string[];
  public dealer: number;
  public shuffler?: Shuffler<Card>;
  public cardsPerPlayer: number;
  public playerCount: number;
  public currentPlayerIndex: number;
  public hands: Card[][];
  public saidUno: boolean[];

  public drawPile: Deck;
  public discardPile: Deck;
  public currentColor: Color | undefined;
  public currentDirection: Direction = "clockwise";
  public faceUpTop: Card | undefined;

  private awaitingDecisionFrom: number | null = null;
  private _ended = false;
  private _winner: number | undefined;
  private _endCallbacks: Array<(e: { winner: number }) => void> = [];

  private uno: UnoState = { status: "idle" }
  private unoSaidAtCount: Map<number, number> = new Map();

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
    this.awaitingDecisionFrom = null;

    if (players.length > 10 || players.length < 2) {
      throw new Error("Player index out of bounds");
    }

    this.playerCount = players.length
    this.hands = Array.from({ length: this.playerCount }, () => []);
    this.saidUno = Array.from({ length: this.playerCount }, () => false);

    const fullUnoDeckCards = buildStandardDeck();
    if (shuffler) {
      shuffler(fullUnoDeckCards);
    }
    this.drawPile = new ArrayDeck(fullUnoDeckCards);

    for (let i = 0; i < this.playerCount; i++) {
      const drawn = this.drawPile.draw(this.cardsPerPlayer) ?? [];

      this.hands[i].push(...drawn)
    }

    this.currentPlayerIndex = dealer < this.playerCount - 1 ? dealer + 1 : 0;

    let firstCard = this.drawPile.draw(1)?.[0];
    while (firstCard?.type == "WILD" || firstCard?.type == "WILD_DRAW") {
      if (shuffler) this.drawPile.shuffle(shuffler);
      firstCard = this.drawPile.draw(1)?.[0];
    }
    this.discardPile = firstCard
      ? new ArrayDeck([firstCard])
      : new ArrayDeck([]);

    if (firstCard) {
      this.faceUpTop = firstCard;
      this.currentColor = firstCard.color
      this.actionBasedOnFirstCard(firstCard)
    }
  }

  player(playerIndex: number) {
    if (playerIndex < 0 || playerIndex >= this.playerCount)
      throw new Error("Player index out of bounds")
    return this.players[playerIndex]
  }

  getDrawPile(): Deck {
    return this.drawPile
  }

  getDiscardPile(): Deck {
    return this.discardPile
  }

  playerHand(player: number) {
    return this.hands[player]
  }

  getPlayerInTurn(): number | undefined {
    return this.isFinished() ? undefined : this.currentPlayerIndex;
  }

  hasEnded(): boolean {
    return this._ended
  }

  winner(): number | undefined {
    return this._winner
  }

  score(): number | undefined {
    if (!this._ended || this._winner === undefined) return undefined
    let sum = 0
    for (let p = 0; p < this.playerCount; p++) {
      if (p === this._winner) continue
      for (const c of this.hands[p]) sum += this.cardScore(c)
    }
    return sum
  }

  onEnd(callback: (e: { winner: number; }) => void): void {
    this._endCallbacks.push(callback)
  }

  sayUno(player: number): void {
    this.ensureNotEnded();
    this.ensurePlayerIndex(player);

    const handSize = this.hands[player].length;
    const isPlayersTurn = this.currentPlayerIndex === player;
    const isPendingAccused =
      this.uno.status === "pending" && this.uno.accused === player && !this.uno.applied;

    if (!isPlayersTurn && !isPendingAccused) return;

    if (handSize === 2 || handSize === 1) {
      this.unoSaidAtCount.set(player, handSize);
      this.saidUno[player] = true;

      if (isPendingAccused) {
        this.uno.satisfied = true;
      }
    }
  }

  draw(): void {
    this.ensureNotEnded();
    this.closeUnoIfWindowExpiredBeforeActorActs();

    const player = this.currentPlayerIndex;

    if (this.drawPile.size === 0) this.replenishDrawPile();
    const taken = this.drawPile.draw(1);
    if (!taken || taken.length === 0) {
      throw new Error("No cards left to draw");
    }

    const card = taken[0];
    this.hands[player].push(card);

    this.unoSaidAtCount.delete(player);
    this.saidUno[player] = false;

    if (this.drawPile.size === 0) this.replenishDrawPile();

    if (!this.isAllowedToPlayCard(card, this.currentColor)) {
      this.awaitingDecisionFrom = null;
      this.nextPlayer(1);
    } else {
      this.awaitingDecisionFrom = player;
    }
  }

  pass(): void {
    this.ensureNotEnded();
    if (this.currentPlayerIndex !== this.awaitingDecisionFrom) {
      throw new Error("Illegal move: cannot pass now");
    }
    this.awaitingDecisionFrom = null;
    this.nextPlayer(1);
  }

  play(cardIndex: number, namedColor?: Color): Card {
    this.ensureNotEnded()
    this.closeUnoIfWindowExpiredBeforeActorActs()

    const actor = this.currentPlayerIndex;
    const hand = this.hands[actor]

    if (hand.length === 0) throw new Error("Illegal move: hand is empty")
    if (cardIndex < 0 || cardIndex >= hand.length)
      throw new Error("Illegal move: card index out of bounds")

    const card = hand[cardIndex]

    if (namedColor && card.type !== "WILD" && card.type !== "WILD_DRAW") {
      throw new Error("Illegal move: cannot name a color on a colored card");
    }

    if ((card.type === "WILD" || card.type === "WILD_DRAW") && !namedColor) {
      throw new Error("Illegal move: wild must choose a color")
    }

    const effectiveColor: Color | undefined =
      card.type === "WILD" || card.type === "WILD_DRAW" ? namedColor : this.currentColor

    if (card.type === "WILD_DRAW") {
      if (this.hasAnyCardOfColor(actor, this.currentColor)) {
        throw new Error("Illegal move: cannot play this card")
      }
    }

    if (!this.isAllowedToPlayCard(card, effectiveColor)) {
      throw new Error("Illegal move: cannot play this card")
    }

    this.awaitingDecisionFrom = null;

    hand.splice(cardIndex, 1)
    this.discardPile.addTop(card)
    this.faceUpTop = card;

    if (this.hands[actor].length === 1) {
      const saidAt = this.unoSaidAtCount.get(actor);
      const satisfiedNow =
        saidAt === 2 || this.saidUno[actor] === true;

      this.uno = {
        status: "pending",
        accused: actor,
        closesWhenTurn: this.peekNextIndex(1),
        satisfied: satisfiedNow,
        applied: false,
      };

      this.unoSaidAtCount.delete(actor);
      this.saidUno[actor] = false;
    } else {
      if (this.uno.status === "pending" && this.uno.accused === actor) {
        this.uno = { status: "idle" };
      }
      this.unoSaidAtCount.delete(actor);
      this.saidUno[actor] = false;
    }

    this.applyCardEffectsInPlay(card, namedColor)

    if (this.hands[actor].length === 0) {
      this.endRound(actor);
    }

    return card
  }

  canPlay(cardIndex: number): boolean {
    if (this._ended) return false;

    const hand = this.hands[this.currentPlayerIndex];
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= hand.length) {
      return false;
    }

    const card = hand[cardIndex];

    if (card.type === "WILD_DRAW") {
      if (this.hasAnyCardOfColor(this.currentPlayerIndex, this.currentColor)) {
        return false;
      }
    }

    const color =
      card.type === "WILD" || card.type === "WILD_DRAW" ? undefined : this.currentColor;

    return this.isAllowedToPlayCard(card, color);
  }

  canPlayAny(): boolean {
    if (this._ended) return false
    const hand = this.hands[this.currentPlayerIndex]
    return hand.some((card) => {
      const color =
        card.type === "WILD" || card.type === "WILD_DRAW" ? undefined : this.currentColor
      return this.isAllowedToPlayCard(card, color)
    });
  }

  catchUnoFailure(data: UnoFailureProps): boolean {
    if (this._ended) return false;
    this.ensurePlayerIndex(data.accused);
    this.ensurePlayerIndex(data.accuser);

    const accusedIndex = data.accused
    const accused = this.hands[accusedIndex]

    if (accused.length !== 1) return false;

    const previousPlayer = this.peekNextIndex(-1)

    if (accusedIndex !== previousPlayer) return false

    const saidAt = this.unoSaidAtCount.get(accusedIndex)
    if (this.saidUno[accusedIndex] || saidAt === 1 || saidAt === 2) return false;

    if (this.uno.status === "pending") {
      if (this.uno.applied) return false;
      if (this.uno.accused !== accusedIndex) return false;
      if (this.uno.satisfied) return false;
    }

    this.drawNToPlayer(accusedIndex, 4);
    if (this.uno.status === "pending") {
      this.uno.applied = true;
    }
    this.uno = { status: "idle" };
    return true;
  }

  toMemento(): any {
    return {
      players: this.players.slice(),
      hands: this.hands.map(p => [...p]),
      drawPile: this.drawPile.toMemento(),
      discardPile: this.discardPile.toMemento(),
      currentColor: this.currentColor,
      currentDirection: this.currentDirection,
      dealer: this.dealer,
      playerInTurn: this.getPlayerInTurn(),
    };
  }

  private flipDirection(): void {
    this.currentDirection =
      this.currentDirection === "clockwise"
        ? "counterclockwise"
        : "clockwise";
  }

  private replenishDrawPile(): void {
    if (!this.faceUpTop) {
      throw new Error("Cannot replenish draw pile: no face-up discard")
    }

    const all = this.discardPile.toMemento() as Card[];

    const rest = all.slice(1);

    this.discardPile = new ArrayDeck([this.faceUpTop]);

    this.drawPile = new ArrayDeck(rest);
    if (this.shuffler) this.drawPile.shuffle(this.shuffler);
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
      case "WILD_DRAW":
        return true;
    }
  }

  private applyCardEffectsInPlay(card: Card, namedColor?: Color): void {
    if (card.type === "WILD" || card.type === "WILD_DRAW") {
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
      case "WILD_DRAW": {
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

  private isFinished(): boolean {
    return this.hands.some(p => p.length === 0);
  }

  private peekNextIndex(steps: number = 1): number {
    const n = this.playerCount;
    const delta = this.currentDirection === "clockwise" ? steps : -steps;
    return (((this.currentPlayerIndex + delta) % n) + n) % n;
  }

  private nextPlayer(steps: number = 1): void {
    this.currentPlayerIndex = this.peekNextIndex(steps)
  }

  private actionBasedOnFirstCard(firstCard: Card): void {
    this.awaitingDecisionFrom = null;
    const n = this.playerCount;
    const leftOfDealer = (this.dealer + 1) % n;
    const rightOfDealer = (this.dealer - 1 + n) % n;

    switch (firstCard.type) {
      case "REVERSE": {
        this.flipDirection();
        this.currentPlayerIndex = rightOfDealer;
        break;
      }
      case "SKIP": {
        this.currentPlayerIndex = (this.dealer + 2) % n;
        break;
      }
      case "DRAW": {
        this.drawNToPlayer(leftOfDealer, 2);
        this.currentPlayerIndex = (this.dealer + 2) % n;
        break;
      }
      default: {
        this.currentPlayerIndex = leftOfDealer;
        break;
      }
    }
  }

  private isAllowedToPlayCard(card: Card, color?: Color): boolean {
    const top = this.discardPile.peek();
    return canPlayOn(card, top, color);
  }

  private drawNToPlayer(targetIndex: number, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.drawPile.size === 0) {
        this.replenishDrawPile();
      }
      const card = this.drawPile.deal();
      if (!card) {
        throw new Error("No cards left to draw");
      }
      this.hands[targetIndex].push(card);
    }
  }

  private endRound(winnerIndex: number): void {
    this._ended = true
    this._winner = winnerIndex
    this.uno = { status: "idle" }
    for (const callback of this._endCallbacks) callback({ winner: winnerIndex })
  }

  private cardScore(card: Card): number {
    switch (card.type) {
      case "NUMBERED": return card.number
      case "DRAW":
      case "REVERSE":
      case "SKIP": return 20
      case "WILD":
      case "WILD_DRAW": return 50
    }
  }

  private closeUnoIfWindowExpiredBeforeActorActs(): void {
    if (this.uno.status !== "pending") return;
    if (this.currentPlayerIndex === this.uno.closesWhenTurn) {
      this.uno = { status: "idle" };
    }
  }

  private ensureNotEnded(): void {
    if (this._ended) throw new Error("Round has ended.")
  }

  private ensurePlayerIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.playerCount) {
      throw new Error("Player index out of bounds")
    }
  }

  private hasAnyCardOfColor(playerIndex: number, color?: Color): boolean {
    if (!color) return false;
    return this.hands[playerIndex].some(c => 'color' in c && (c).color === color)
  }
}

export function createRoundClassFromMemento(memento: any, shuffler: Shuffler<Card>): Round {
  const players: string[] = memento.players ?? [];
  const handsRaw: Card[][] = memento.hands ?? [];
  const drawPileRaw = memento.drawPile ?? [];
  const discardPileRaw = memento.discardPile ?? [];
  const dealer: number = memento.dealer ?? 0;
  const currentDirection: Direction = memento.currentDirection ?? 'clockwise';
  const currentColorMaybe = memento.currentColor;

  if (players.length < 2) {
    throw new Error("Invalid memento: must have at least 2 players.");
  }

  if (players.length > 10) {
    throw new Error("Invalid memento: cannot have more than 10 players.");
  }

  if (handsRaw.length !== players.length) {
    throw new Error("Invalid memento: number of hands must equal number of players.");
  }

  const emptyHands = handsRaw.filter(h => (h?.length ?? 0) === 0).length;
  if (emptyHands > 1) {
    throw new Error("Invalid memento: more than one winner (multiple empty hands).");
  }

  if (!Array.isArray(discardPileRaw) || discardPileRaw.length === 0) {
    throw new Error("Invalid memento: discard pile cannot be empty.");
  }

  const validColors: Readonly<Color[]> = ["RED", "YELLOW", "GREEN", "BLUE"] as const;
  if (currentColorMaybe !== undefined && currentColorMaybe !== null) {
    if (!validColors.includes(currentColorMaybe as Color)) {
      throw new Error("Invalid memento: currentColor must be one of RED, YELLOW, GREEN, BLUE or undefined.");
    }
  }

  if (!Number.isInteger(dealer) || dealer < 0 || dealer >= players.length) {
    throw new Error("Invalid memento: dealer index out of bounds.");
  }

  const drawPile = createFromMemento(drawPileRaw);
  const discardPile = createFromMemento(discardPileRaw);

  const top = discardPile.peek() as Card | undefined;
  const topColor: Color | undefined = top && hasColor(top) ? (top as any).color : undefined;

  if (topColor && currentColorMaybe && currentColorMaybe !== topColor) {
    throw new Error("Invalid memento: currentColor inconsistent with top discard.");
  }

  const isFinished = handsRaw.some(h => h.length === 0)
  const playerIndex = memento.playerInTurn;

  if (!isFinished) {
    if (playerIndex === undefined || playerIndex === null) {
      throw new Error("Invalid memento: playerInTurn is required when the round is not finished.");
    }
    if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= players.length) {
      throw new Error("Invalid memento: playerInTurn index out of bounds.");
    }
  } else {
    if (playerIndex !== undefined && playerIndex !== null) {
      if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= players.length) {
        throw new Error("Invalid memento: playerInTurn index out of bounds.");
      }
    }
  }

  const blank = Object.create(RoundClass.prototype) as RoundClass;

  blank.players = players;
  blank.dealer = dealer;
  blank.shuffler = shuffler;
  blank.cardsPerPlayer = 0;
  blank.playerCount = players.length;
  blank.hands = handsRaw.map((h) => h.slice())
  blank.drawPile = drawPile;
  blank.discardPile = discardPile;
  blank.faceUpTop = discardPile.peek() as Card | undefined;
  blank.currentColor =
    (currentColorMaybe as Color | undefined) ?? (topColor as Color | undefined);
  blank.currentDirection = currentDirection;
  blank.currentPlayerIndex = (playerIndex as number) ?? 0;

  (blank as any)._ended = isFinished;
  (blank as any)._winner = isFinished
    ? blank.hands.findIndex((h) => h.length === 0)
    : undefined;
  (blank as any)._endCallbacks = [];
  (blank as any).uno = { status: "idle" };
  (blank as any).unoSaidAtCount = new Map<number, number>();
  (blank as any).saidUno = Array.from({ length: players.length }, () => false);
  (blank as any).awaitingDecisionFrom = null;

  return blank;
}
