export type Color =
    | "RED"
    | "BLUE"
    | "YELLOW"
    | "GREEN"

export type Type =
    | "NUMBERED"
    | "SKIP"
    | "DRAW"
    | "REVERSE"
    | "WILD"
    | "WILD DRAW"

export type Numbered = {
    readonly type: "NUMBERED"
    readonly color: Color
    readonly number: | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

export type Action = {
    readonly type: | "SKIP" | "DRAW" | "REVERSE"
    readonly color: Color
}

export type Wild = {
    readonly type: | "WILD" | "WILD DRAW"
}

export type Card = Numbered | Action | Wild

const colors: Readonly<Color[]> = ["RED", "BLUE", "YELLOW", "GREEN"] as const

export interface Deck {
    readonly length: number
    readonly cards: Card[]
    filter(pred: (card: Card) => boolean): Card[]
    draw(count: number): Card[] | undefined
}

export function createInitialDeck(): Deck {
    const cards: Card[] = [];

    for (const color of colors) {
        cards.push({ type: "NUMBERED", color, number: 0 });
        for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
            cards.push({ type: "NUMBERED", color, number: n });
            cards.push({ type: "NUMBERED", color, number: n });
        }
    }

    for (const color of colors) {
        cards.push({ type: "SKIP", color }, { type: "SKIP", color });
        cards.push({ type: "REVERSE", color }, { type: "REVERSE", color });
        cards.push({ type: "DRAW", color }, { type: "DRAW", color });
    }

    for (let i = 0; i < 4; i++) {
        cards.push({ type: "WILD" });
        cards.push({ type: "WILD DRAW" });
    }

    return createDeck(cards)
}

export function createDeck(cards: Card[]): Deck {
    return {
        length: cards.length,
        cards,
        filter: function (pred: (card: Card) => boolean): Card[] {
            return this.cards.filter(pred)
        },
        draw: function (count: number): Card[] | undefined {
            const cards: Card[] = [];
            for (let i = 0; i < count; i++) {
                const card = this.cards.shift();
                if (card) {
                    cards.push(card);
                }
            }
            return cards;
        }
    }
}