import * as _ from 'lodash/fp'
import { Card, Color, createInitialDeck, Deck } from "./deck"
import { Shuffler, standardShuffler } from '../utils/random_utils'
import { update } from 'lodash'

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
}

export const canPlay = (card: Card, topCard: Card, currentColor: Color): boolean => {
    return card.type === 'WILD' || card.type === 'WILD DRAW' ||
        card.color === topCard.color || card.number === topCard.number ||
        card.color === currentColor;
};

export const canPlayAny = (round: Round): boolean => {
    const topCard = topOfDiscard(round)
    const currentColor = round.currentColor

    return round.hands[round.playerInTurn].some(card => canPlay(card, topCard, currentColor))
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

export const drawMultiple = (round: Round, count: number): Round => {
    _.times(() => {
        const drawnCard = round.drawPile.shift();
        if (drawnCard) {
            round.hands[round.playerInTurn].push(drawnCard);
        }

        if (round.drawPile.length === 0) replenishDrawPile(round)
    }, count)

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
    const topCard = topOfDiscard(round);

    if (cardToPlay.type === 'WILD' || cardToPlay.type === 'WILD DRAW') {
        if (!namedColor) throw new Error(`Error: illegal not to name a color`);
        round.currentColor = namedColor;
    } else if (!canPlay(cardToPlay, topCard, round.currentColor)) {
        throw new Error(`Error: illegal play`);
    } else if (canPlay(cardToPlay, topCard, round.currentColor) && namedColor)
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
            round = drawMultiple(round, 2); // Draw 2 cards for the next player
            updatePlayerTurn(round); // Skip the player which has drawn 2 cards
            break;
        case 'WILD DRAW':
            round.currentColor = namedColor!;
            updatePlayerTurn(round); // Move to the next player
            round = drawMultiple(round, 4); // Draw 4 cards for the next player
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

    return round;
};

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

    const hands = _.chunk(cardsPerPlayer, shuffledDeck.slice(0, cardsPerPlayer * players.length)) // Deal cardsPerPlayer cards to each player

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
        shuffler
    }
}