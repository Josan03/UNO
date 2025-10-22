import { Shuffler, standardShuffler } from "../utils/random_utils"
import { Card, createDeck, createInitialDeck, Deck } from "./deck"

export interface Round {
    readonly players: string[]
    readonly dealer: number
    readonly playerCount: number
    hands: Card[][]
    drawPile: Deck
    discardPile: Deck
}

export function createRound(players: string[], dealer: number, shuffler?: Shuffler<Card>, cardsPerPlayer?: number): Round {
    if (players.length < 2 || players.length > 10)
        throw new Error(`Error: invalid number of players`)

    if (!cardsPerPlayer)
        cardsPerPlayer = 7

    if (!shuffler)
        shuffler = standardShuffler

    const drawPile: Deck = createInitialDeck()
    shuffler(drawPile.cards)

    let discardPile: Deck = undefined

    const hands: Card[][] = []
    for (let i = 0; i < players.length; i++) {
        const card = drawPile.draw(cardsPerPlayer)

        if (card)
            hands[i].push(...card)
    }

    const firstCard = drawPile.draw(1)
    if (firstCard)
        discardPile = createDeck([...firstCard])

    return {
        players,
        dealer,
        playerCount: players.length,
        hands,
        drawPile,
        discardPile
    }
}