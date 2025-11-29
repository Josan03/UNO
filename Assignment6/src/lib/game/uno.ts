import { createRound, Round, hasEnded, winner } from './round'
import { Shuffler, standardShuffler } from './random_utils'
import { Card, createInitialDeck } from './deck'

export type GameProps = {
    players?: string[]
    targetScore?: number
    randomizer?: () => number
    shuffler?: Shuffler<Card>
    cardsPerPlayer?: number
}

export type Game = {
    playerCount: number
    players: string[]
    targetScore: number
    scores: number[]
    winner: number | undefined
    currentRound: Round | undefined
    dealer: number
    randomizer: () => number
    shuffler: Shuffler<Card>
    cardsPerPlayer: number
}

export const createGame = (props: Partial<GameProps>): Game => {
    const players = props.players ?? ['A', 'B']
    const targetScore = props.targetScore ?? 500
    const randomizer = props.randomizer ?? Math.random
    const shuffler = props.shuffler ?? standardShuffler
    const cardsPerPlayer = props.cardsPerPlayer ?? 7

    if (players.length < 2) {
        throw new Error('At least 2 players are required')
    }
    if (targetScore <= 0) {
        throw new Error('Target score must be greater than 0')
    }

    let dealer = randomizer()
    if (dealer < 1) {
        dealer = Math.floor(dealer * players.length)
    }
    dealer = dealer % players.length

    const originalShuffler = shuffler

    const game: Game = {
        playerCount: players.length,
        players,
        targetScore,
        scores: players.map(() => 0),
        winner: undefined,
        currentRound: undefined,
        dealer,
        randomizer,
        shuffler: originalShuffler,
        cardsPerPlayer
    }

    const firstRoundDeck = originalShuffler(createInitialDeck())

    const firstRoundShuffler: Shuffler<Card> = (cards) => {
        if (cards.length === 108) {
            return firstRoundDeck
        }
        return standardShuffler(cards)
    }

    game.currentRound = createRound(players, dealer, firstRoundShuffler, cardsPerPlayer)

    return game
}

export const play = (roundAction: (round: Round) => Round, game: Game): Game => {
    if (game.currentRound === undefined || game.winner !== undefined) {
        return game
    }

    const newRound = roundAction(game.currentRound)

    const newGame: Game = {
        ...game,
        scores: [...game.scores],
        currentRound: newRound
    }

    if (newRound.playerInTurn === undefined) {
        const roundWinner = newRound.hands.findIndex(hand => hand.length === 0)
        const roundScore = newRound.hands.reduce((total, hand, index) => {
            if (index === roundWinner) return total
            return total + hand.reduce((sum, card) => {
                if (card.type === 'NUMBERED') return sum + (card.number ?? 0)
                if (card.type === 'WILD' || card.type === 'WILD DRAW') return sum + 50
                return sum + 20
            }, 0)
        }, 0)

        newGame.scores[roundWinner] += roundScore

        const gameWinner = newGame.scores.findIndex(score => score >= newGame.targetScore)
        if (gameWinner !== -1) {
            newGame.winner = gameWinner
            newGame.currentRound = undefined
        } else {
            const nextDealer = (game.dealer + 1) % game.players.length
            newGame.dealer = nextDealer

            const newRoundDeck = newGame.shuffler(createInitialDeck())

            const roundShuffler: Shuffler<Card> = (cards) => {
                if (cards.length === 108) {
                    return newRoundDeck
                }
                return standardShuffler(cards)
            }

            newGame.currentRound = createRound(newGame.players, nextDealer, roundShuffler, newGame.cardsPerPlayer)
        }
    }

    return newGame
}
