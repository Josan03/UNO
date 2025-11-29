import * as _ from 'lodash'

export type Color =
    | "RED"
    | "GREEN"
    | "BLUE"
    | "YELLOW"

export type Type =
    | "NUMBERED"
    | "SKIP"
    | "REVERSE"
    | "DRAW"
    | "WILD"
    | "WILD DRAW"

export type Card = {
    type: Type
    color?: Color
    number?: number
}

export type Deck = Card[]

const createInitialDeck = (): Card[] => {
    const colors: Color[] = ['RED', 'GREEN', 'BLUE', 'YELLOW']

    const createNumberedCards = (color: Color): Card[] => {
        const cards: Card[] = []
        cards.push({ type: 'NUMBERED', color, number: 0 })
        for (let i = 1; i <= 9; i++) {
            cards.push({ type: 'NUMBERED', color, number: i })
            cards.push({ type: 'NUMBERED', color, number: i })
        }
        return cards
    }

    const createSpecialCards = (type: Type, color: Color): Card[] => {
        return [
            { type, color },
            { type, color }
        ]
    }

    const createWildCards = (): Card[] => {
        return [
            { type: 'WILD' },
            { type: 'WILD' },
            { type: 'WILD' },
            { type: 'WILD' },
            { type: 'WILD DRAW' },
            { type: 'WILD DRAW' },
            { type: 'WILD DRAW' },
            { type: 'WILD DRAW' }
        ]
    }

    const numberedDeck = colors.flatMap(createNumberedCards)
    const skipCards = colors.flatMap(color => createSpecialCards('SKIP', color))
    const reverseCards = colors.flatMap(color => createSpecialCards('REVERSE', color))
    const drawCards = colors.flatMap(color => createSpecialCards('DRAW', color))
    const wildCards = createWildCards()

    return [
        ...numberedDeck,
        ...skipCards,
        ...reverseCards,
        ...drawCards,
        ...wildCards
    ]
}

export { createInitialDeck }