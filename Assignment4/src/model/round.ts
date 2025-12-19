import { Card, Color, createInitialDeck, Deck } from "./deck"
import { Shuffler, standardShuffler } from "../utils/random_utils"

export type Direction = "clockwise" | "counterclockwise"

export interface Round {
    players: string[]
    dealer: number
    playerCount: number
    hands: Card[][]
    drawPile: Deck
    discardPile: Deck
    playerInTurn: number | undefined
    currentColor: Color
    currentDirection: Direction
    shuffler: (deck: Deck) => Deck
    unoCalled: boolean[]
    unoFailureChecked: boolean
    unoFailureCandidate: number | undefined
}

export const createRound = (
    players: string[],
    dealer: number,
    shuffler: Shuffler<Card> = standardShuffler,
    cardsPerPlayer: number = 7
): Round => {
    if (players.length < 2 || players.length > 10)
        throw new Error(`Error: players count should be between 2 and 10`)

    let deck = createInitialDeck()
    deck = shuffler(deck)

    const hands: Card[][] = []
    for (let i = 0; i < players.length; i++) {
        hands.push(deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer))
    }

    const dealtCardsCount = players.length * cardsPerPlayer

    // Get remaining cards for discard and draw pile
    let remainingCards = deck.slice(dealtCardsCount)
    let firstCard = remainingCards[0]
    let drawPile = remainingCards.slice(1)

    // Reshuffle remaining cards if first card is wild
    while (firstCard.type === 'WILD' || firstCard.type === 'WILD DRAW') {
        remainingCards = shuffler(remainingCards)
        firstCard = remainingCards[0]
        drawPile = remainingCards.slice(1)
    }

    const discardPile = [firstCard]
    const topCard = firstCard
    const currentColor = topCard.color!
    let currentDirection: Direction = 'clockwise'
    let playerInTurn: number

    // Determine starting player based on top card
    if (topCard.type === 'REVERSE') {
        currentDirection = 'counterclockwise'
        playerInTurn = (dealer - 1 + players.length) % players.length
    } else if (topCard.type === 'SKIP') {
        playerInTurn = (dealer + 2) % players.length
    } else if (topCard.type === 'DRAW') {
        playerInTurn = (dealer + 1) % players.length
        const drawnCards = drawPile.slice(0, 2)
        hands[playerInTurn].push(...drawnCards)
        drawPile = drawPile.slice(2)
        playerInTurn = (playerInTurn + 1) % players.length
    } else {
        playerInTurn = (dealer + 1) % players.length
    }

    return {
        players,
        dealer,
        playerCount: players.length,
        hands,
        drawPile,
        discardPile,
        playerInTurn,
        currentColor,
        currentDirection,
        shuffler,
        unoCalled: new Array(players.length).fill(false),
        unoFailureChecked: false,
        unoFailureCandidate: undefined
    }
}

export const topOfDiscard = (round: Round): Card => round.discardPile[0]

export const canPlay = (cardIndex: number, round: Round): boolean => {
    if (round.playerInTurn === undefined) return false
    if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length) return false

    const card = round.hands[round.playerInTurn][cardIndex]
    const topCard = topOfDiscard(round)

    if (card.type === 'WILD DRAW') {
        const hand = round.hands[round.playerInTurn]
        const hasMatchingColor = hand.some((c, idx) =>
            idx !== cardIndex && c.color === round.currentColor
        )
        if (hasMatchingColor) return false
        return true
    }

    if (card.type === 'WILD') return true

    if (card.color === round.currentColor) return true

    if (card.type === 'NUMBERED' && topCard.type === 'NUMBERED') {
        return card.number === topCard.number
    }

    if (card.type === topCard.type) return true

    return false
}

export const canPlayAny = (round: Round): boolean => {
    if (round.playerInTurn === undefined) return false

    const hand = round.hands[round.playerInTurn]
    return hand.some((_, index) => canPlay(index, round))
}

export const draw = (round: Round): Round => {
    if (round.playerInTurn === undefined) {
        throw new Error('Error: game has ended')
    }

    const currentPlayer = round.playerInTurn

    const newRound: Round = {
        ...round,
        hands: round.hands.map(hand => [...hand]),
        drawPile: [...round.drawPile],
        discardPile: [...round.discardPile],
        unoCalled: [...round.unoCalled],
        unoFailureCandidate: round.unoFailureCandidate === round.playerInTurn ? round.unoFailureCandidate : undefined,
        unoFailureChecked: false
    }

    for (let i = 0; i < newRound.unoCalled.length; i++) {
        if (i !== currentPlayer) {
            newRound.unoCalled[i] = false
        }
    }

    if (newRound.drawPile.length === 0) {
        const topCard = newRound.discardPile[0]
        const cardsToShuffle = newRound.discardPile.slice(1)
        newRound.drawPile = newRound.shuffler(cardsToShuffle)
        newRound.discardPile = [topCard]
    }

    const drawnCard = newRound.drawPile.shift()!
    newRound.hands[newRound.playerInTurn!].push(drawnCard)

    if (newRound.drawPile.length === 0 && newRound.discardPile.length > 1) {
        const topCard = newRound.discardPile[0]
        const cardsToShuffle = newRound.discardPile.slice(1)
        newRound.drawPile = newRound.shuffler(cardsToShuffle)
        newRound.discardPile = [topCard]
    }

    if (!canPlayAny(newRound)) {
        const nextPlayer = (newRound.playerInTurn! + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
        newRound.playerInTurn = nextPlayer
    }

    return newRound
}

export const play = (cardIndex: number, namedColor: Color | undefined, round: Round): Round => {
    if (round.playerInTurn === undefined) {
        throw new Error('Error: game has ended')
    }

    if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length) {
        throw new Error('Error: invalid card index')
    }

    const card = round.hands[round.playerInTurn][cardIndex]

    if ((card.type === 'WILD' || card.type === 'WILD DRAW') && !namedColor) {
        throw new Error('Error: must name a color for wild cards')
    }

    if (card.color && namedColor) {
        throw new Error('Error: cannot name color for colored cards')
    }

    if (!canPlay(cardIndex, round)) {
        throw new Error('Error: illegal play')
    }

    const newRound: Round = {
        ...round,
        hands: round.hands.map(hand => [...hand]),
        drawPile: [...round.drawPile],
        discardPile: [...round.discardPile],
        unoCalled: [...round.unoCalled]
    }

    newRound.hands[newRound.playerInTurn!].splice(cardIndex, 1)
    newRound.discardPile.unshift(card)

    newRound.currentColor = namedColor || card.color!

    const currentPlayer = newRound.playerInTurn!

    newRound.unoFailureChecked = false

    if (newRound.unoFailureCandidate !== undefined && newRound.unoFailureCandidate !== currentPlayer) {
        newRound.unoFailureCandidate = undefined
    }

    for (let i = 0; i < newRound.unoCalled.length; i++) {
        if (i !== currentPlayer) {
            newRound.unoCalled[i] = false
        }
    }

    if (newRound.hands[currentPlayer].length === 1) {
        newRound.unoFailureCandidate = currentPlayer
    }

    switch (card.type) {
        case 'SKIP':
            newRound.playerInTurn = (currentPlayer + (newRound.currentDirection === 'clockwise' ? 2 : -2) + newRound.players.length) % newRound.players.length
            break

        case 'REVERSE':
            newRound.currentDirection = newRound.currentDirection === 'clockwise' ? 'counterclockwise' : 'clockwise'

            // In 2-player game, reverse works as skip
            if (newRound.playerCount === 2) {
                newRound.playerInTurn = currentPlayer
            } else {
                newRound.playerInTurn = (currentPlayer + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            }
            break

        case 'DRAW':
            const nextPlayer = (currentPlayer + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            newRound.playerInTurn = nextPlayer

            // Draw 2 cards for that player
            for (let i = 0; i < 2; i++) {
                if (newRound.drawPile.length === 0) {
                    const topCard = newRound.discardPile[0]
                    const cardsToShuffle = newRound.discardPile.slice(1)
                    newRound.drawPile = newRound.shuffler(cardsToShuffle)
                    newRound.discardPile = [topCard]
                }
                const drawnCard = newRound.drawPile.shift()!
                newRound.hands[nextPlayer].push(drawnCard)
            }

            newRound.playerInTurn = (nextPlayer + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            break

        case 'WILD DRAW':
            const nextPlayerWild = (currentPlayer + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            newRound.playerInTurn = nextPlayerWild

            for (let i = 0; i < 4; i++) {
                if (newRound.drawPile.length === 0) {
                    const topCard = newRound.discardPile[0]
                    const cardsToShuffle = newRound.discardPile.slice(1)
                    newRound.drawPile = newRound.shuffler(cardsToShuffle)
                    newRound.discardPile = [topCard]
                }
                const drawnCard = newRound.drawPile.shift()!
                newRound.hands[nextPlayerWild].push(drawnCard)
            }

            newRound.playerInTurn = (nextPlayerWild + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            break

        case 'WILD':
        case 'NUMBERED':
        default:
            newRound.playerInTurn = (currentPlayer + (newRound.currentDirection === 'clockwise' ? 1 : -1) + newRound.players.length) % newRound.players.length
            break
    }

    if (newRound.hands[currentPlayer].length === 0) {
        newRound.playerInTurn = undefined
    }

    return newRound
}

export const sayUno = (playerIndex: number, round: Round): Round => {
    if (round.playerInTurn === undefined) {
        throw new Error('Error: game has ended')
    }

    if (playerIndex < 0 || playerIndex >= round.players.length) {
        throw new Error('Error: invalid player index')
    }

    const newRound: Round = {
        ...round,
        hands: round.hands.map(hand => [...hand]),
        drawPile: [...round.drawPile],
        discardPile: [...round.discardPile],
        unoCalled: [...round.unoCalled]
    }

    newRound.unoCalled[playerIndex] = true

    return newRound
}

export const checkUnoFailure = (accuser: { accuser: number, accused: number }, round: Round): boolean => {
    const { accused } = accuser

    if (accused < 0 || accused >= round.players.length) {
        throw new Error('Error: invalid accused player index')
    }

    if (round.hands[accused].length !== 1) return false
    if (round.unoCalled[accused]) return false

    if (round.unoFailureCandidate !== accused) return false

    if (round.unoFailureChecked) return false

    return true
}

export const catchUnoFailure = (accuser: { accuser: number, accused: number }, round: Round): Round => {
    const { accused } = accuser

    if (accused < 0 || accused >= round.players.length) {
        throw new Error('Error: invalid accused player index')
    }

    if (!checkUnoFailure(accuser, round)) {
        return round
    }

    const newRound: Round = {
        ...round,
        hands: round.hands.map(hand => [...hand]),
        drawPile: [...round.drawPile],
        discardPile: [...round.discardPile],
        unoCalled: [...round.unoCalled],
        unoFailureChecked: true
    }

    for (let i = 0; i < 4; i++) {
        if (newRound.drawPile.length === 0 && newRound.discardPile.length > 1) {
            const topCard = newRound.discardPile[0]
            const cardsToShuffle = newRound.discardPile.slice(1)
            newRound.drawPile = newRound.shuffler(cardsToShuffle)
            newRound.discardPile = [topCard]
        }

        if (newRound.drawPile.length > 0) {
            const drawnCard = newRound.drawPile.shift()!
            newRound.hands[accused].push(drawnCard)
        }
    }

    return newRound
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
