import { Randomizer, Shuffler, standardRandomizer, standardShuffler } from '../utils/random_utils'
import { Card } from './deck'
import { Round, createRound, hasEnded, score, winner } from './round'

export type Game = {
    readonly players: string[]
    readonly targetScore: number
    readonly playerCount: number
    readonly scores: number[]
    readonly winner: number | undefined
    readonly currentRound: Round | undefined
    readonly shuffler?: Shuffler<Card>
    readonly cardsPerPlayer?: number
}

export type GameProps = {
    players?: string[]
    targetScore?: number
    randomizer?: Randomizer
    shuffler?: Shuffler<Card>
    cardsPerPlayer?: number
}

export function createGame(props: GameProps): Game {
    const players = props.players ?? ['A', 'B']
    const targetScore = props.targetScore ?? 500
    const randomizer = props.randomizer ?? standardRandomizer
    const shuffler = props.shuffler ?? standardShuffler
    const cardsPerPlayer = props.cardsPerPlayer ?? 7

    if (!Array.isArray(players) || players.length < 2) {
        throw new Error('At least 2 players are required')
    }
    if (!Number.isFinite(targetScore) || targetScore <= 0) {
        throw new Error('Target score must be greater than 0')
    }

    const dealer = Math.floor(randomizer(players.length))
    const initialRound = createRound(players, dealer, shuffler, cardsPerPlayer)
    const scores = Array(players.length).fill(0)

    return {
        players,
        targetScore,
        playerCount: players.length,
        scores,
        winner: undefined,
        currentRound: initialRound,
        shuffler,
        cardsPerPlayer
    }
}

export function play(roundTransform: (round: Round) => Round, game: Game): Game {
    if (!game.currentRound) {
        return game
    }

    const newRound = roundTransform(game.currentRound)

    if (!hasEnded(newRound)) {
        return {
            ...game,
            currentRound: newRound
        }
    }

    const winnerIndex = winner(newRound)
    if (winnerIndex === undefined) {
        return game
    }

    const earnedScore = score(newRound) ?? 0
    const newScores = [...game.scores]
    newScores[winnerIndex] += earnedScore

    const gameWinner = newScores.findIndex(s => s >= game.targetScore)

    if (gameWinner !== -1) {
        return {
            ...game,
            scores: newScores,
            winner: gameWinner,
            currentRound: undefined
        }
    }

    const newDealer = winnerIndex
    const shufflerToUse = game.shuffler ?? standardShuffler
    const cardsPerPlayerToUse = game.cardsPerPlayer ?? 7
    const newRoundInstance = createRound(game.players, newDealer, shufflerToUse, cardsPerPlayerToUse)

    return {
        ...game,
        scores: newScores,
        currentRound: newRoundInstance
    }
}