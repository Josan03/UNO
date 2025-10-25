import * as _ from 'lodash/fp'
import { Card, Color, createInitialDeck, Deck } from "./deck"
import { Shuffler, standardShuffler } from '../utils/random_utils'

export type Direction = "clockwise" | "counterclockwise"

export interface Round {
    players: string[]
    dealer: number
    playerCount: number
    hands: Card[][]
    drawPile: Deck
    discardPile: Deck
    playerInTurn: number
    currentColor: Color
    currentDirection: Direction
    shuffler: (deck: Deck) => Deck
    unoCalled: boolean[]
}

export const canPlay = (cardIndex: number, round: Round): boolean => {
    if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length)
        return false

    const cardToPlay = round.hands[round.playerInTurn][cardIndex];
    const topCard = topOfDiscard(round);
    const currentColor = round.currentColor;

    if (cardToPlay.type === 'WILD DRAW') {
        if (topCard.type === 'DRAW')
            return true

        const hasMatchingColorCard = round.hands[round.playerInTurn].some(card => card.color === currentColor && card.type !== 'DRAW')
        if (hasMatchingColorCard)
            return false
    }

    if (cardToPlay.type === 'WILD' || cardToPlay.type === 'WILD DRAW')
        return true

    if (cardToPlay.type === 'NUMBERED' && topCard.type === 'NUMBERED')
        return cardToPlay.color === topCard.color || cardToPlay.number === topCard.number

    if (cardToPlay.type === 'NUMBERED' && topCard.type !== 'NUMBERED')
        return cardToPlay.color === currentColor

    if (cardToPlay.type === topCard.type)
        return true


    return cardToPlay.color === currentColor
};

export const canPlayAny = (round: Round): boolean => {
    return round.hands[round.playerInTurn].some((_, index) => canPlay(index, round))
}

export const topOfDiscard = (round: Round): Card => round.discardPile[0];

export const updatePlayerTurn = (round: Round): void => {
    const nextPlayer = (round.playerInTurn + (round.currentDirection === 'clockwise' ? 1 : -1) + round.players.length) % round.players.length;
    round.playerInTurn = nextPlayer
};

export const draw = (round: Round): Round => {
    const drawnCard = round.drawPile.shift();
    if (drawnCard) {
        round.hands[round.playerInTurn].push(drawnCard);
    }

    if (round.drawPile.length === 0) replenishDrawPile(round);
    if (!canPlayAny(round)) updatePlayerTurn(round);

    return round;
};

export const drawMultiple = (round: Round, count: number, playerIndex: number): Round => {
    for (let i = 0; i < count; i++) {
        const drawnCard = round.drawPile.shift();
        if (drawnCard) {
            round.hands[playerIndex].push(drawnCard);
        }

        if (round.drawPile.length === 0) replenishDrawPile(round)
    }

    return round
}

const replenishDrawPile = (round: Round): void => {
    const topCard = round.discardPile[0];
    const remainingCards = round.discardPile.slice(1);
    round.drawPile = round.shuffler(remainingCards);
    round.discardPile = [topCard];
};

export const play = (cardIndex: number, namedColor?: Color, round: Round): Round => {
    if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length)
        throw new Error(`Error: invalid card index, out of bounds`)

    const cardToPlay = round.hands[round.playerInTurn][cardIndex];

    if (cardToPlay.type === 'WILD' || cardToPlay.type === 'WILD DRAW') {
        if (!namedColor) throw new Error(`Error: illegal not to name a color`);
    } else if (!canPlay(cardIndex, round)) {
        throw new Error(`Error: illegal play`);
    } else if (canPlay(cardIndex, round) && namedColor)
        throw new Error(`Error: illegal changing color`)

    round.hands[round.playerInTurn].splice(cardIndex, 1);
    round.discardPile.unshift(cardToPlay);

    switch (cardToPlay.type) {
        case 'REVERSE':
            if (round.playerCount === 2) {
                updatePlayerTurn(round) // Reverse works as skip for 2 players
            }
            round.currentDirection = round.currentDirection === 'clockwise' ? 'counterclockwise' : 'clockwise';
            updatePlayerTurn(round);
            break;
        case 'SKIP':
            updatePlayerTurn(round);
            updatePlayerTurn(round); // Skip the next player
            break;
        case 'DRAW':
            updatePlayerTurn(round); // Move to the next player
            round = drawMultiple(round, 2, round.playerInTurn); // Draw 2 cards for the next player
            updatePlayerTurn(round); // Skip the player which has drawn 2 cards
            break;
        case 'WILD DRAW':
            round.currentColor = namedColor!;
            updatePlayerTurn(round); // Move to the next player
            round = drawMultiple(round, 4, round.playerInTurn); // Draw 4 cards for the next player
            updatePlayerTurn(round); // Skip the player which has drawn 4 cards
            break;
        case 'WILD':
            round.currentColor = namedColor!;
            updatePlayerTurn(round);
            break;
        default:
            round.currentColor = cardToPlay.color!;
            updatePlayerTurn(round);
    }

    return round
}

export const sayUno = (playerIndex: number, round: Round): Round => {
    if (round.hands[playerIndex].length === 1)
        round.unoCalled[playerIndex] = true

    return round
}

export const checkUnoFailure = (accuser: { accuser: number, accused: number }, round: Round): boolean => {
    const accused = accuser.accused

    if (round.hands[accused].length === 1 && !round.unoCalled[accused])
        return true

    return false
}

export const catchUnoFailure = (accuser: { accuser: number, accused: number }, round: Round): Round => {
    const accused = accuser.accused

    if (round.hands[accused].length === 1 && !round.unoCalled[accused]) {
        round = drawMultiple(round, 4, accused)
    }

    return round
}

export const hasEnded = (round: Round): boolean => {
    return round.hands.some(hand => hand.length === 0)
}

export const winner = (round: Round): number | undefined => {
    const winnerIndex = round.hands.findIndex(hand => hand.length === 0)
    return winnerIndex >= 0 ? winnerIndex : undefined
}

export const score = (round: Round): number | undefined => {
    if (!hasEnded(round)) return undefined

    let totalScore = 0

    round.hands.forEach(hand => {
        hand.forEach(card => {
            if (card.type === 'NUMBERED') {
                totalScore += card.number!
            } else if (['SKIP', 'REVERSE', 'DRAW'].includes(card.type)) {
                totalScore += 20
            } else if (card.type === 'WILD' || card.type === 'WILD DRAW') {
                totalScore += 50
            }
        })
    })

    return totalScore
}

export const createRound = (
    players: string[],
    dealer: number,
    shuffler?: (deck: Deck) => Deck,
    cardsPerPlayer: number = 7
): Round => {
    if (players.length < 2 || players.length > 10)
        throw new Error(`Error: players count should be between 2 and 10`)

    if (!shuffler)
        shuffler = standardShuffler

    const deck = createInitialDeck()
    const shuffledDeck = shuffler(deck)

    const hands = Array.from({ length: players.length }, (_, index) =>
        shuffledDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
    );

    const discardPile = [shuffledDeck[cardsPerPlayer * players.length]] // First card
    let drawPile = shuffledDeck.slice(cardsPerPlayer * players.length + 1) // All other cards remained

    let playerInTurn = (dealer + 1) % players.length
    let topCard = discardPile[0]

    const reshuffleIfWildCard = (topCard: Card): Deck => {
        if (topCard.type === "WILD" || topCard.type === "WILD DRAW") {
            let reshuffledDeck = shuffler(drawPile)
            discardPile[0] = reshuffledDeck[0]
            return reshuffledDeck.slice(1)
        }
        return drawPile
    }

    while (topCard.type === "WILD" || topCard.type === "WILD DRAW") {
        drawPile = reshuffleIfWildCard(topCard)
        topCard = discardPile[0]
    }

    const currentColor: Color = topCard.color!

    let direction: Direction = "clockwise"

    if (topCard.type === 'REVERSE') {
        direction = "counterclockwise"
        playerInTurn = (dealer + (players.length - 1)) % players.length
    } else if (topCard.type === 'SKIP') {
        playerInTurn = (dealer + 2) % players.length
    } else if (topCard.type === 'DRAW') {
        playerInTurn = (dealer + 1) % players.length
        hands[playerInTurn].push(drawPile.shift()!)
        hands[playerInTurn].push(drawPile.shift()!)
        playerInTurn = (dealer + 2) % players.length
    }

    return {
        players,
        dealer,
        playerCount: players.length,
        hands,
        discardPile,
        drawPile,
        playerInTurn,
        currentColor,
        currentDirection: direction,
        shuffler,
        unoCalled: Array(players.length).fill(false)
    }
}