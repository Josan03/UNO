import { Round, RoundClass } from "./round"

export type Game = {
    readonly players: string[]
    readonly targetScore: number
    player(index: number): string
    playerCount(): number
    score(index: number): number
    winner(): string | undefined
    currentRound(): Round
}

export class UnoGame implements Game {
    public players: string[]
    public playerScores: Map<string, number>
    public targetScore: number

    constructor(players: string[], targetScore: number) {
        this.players = players
        this.playerScores = new Map<string, number>()
        for (const player of players) {
            this.playerScores.set(player, 0)
        }
        this.targetScore = targetScore
    }

    playerCount(): number {
        return this.players.length
    }

    player(index: number): string {
        if (index < 0 || index >= this.players.length) {
            throw new Error("Player index out of bounds")
        }
        return this.players[index]
    }

    score(index: number): number {
        const player = this.player(index)
        return this.playerScores.get(player)!
    }

    winner(): string | undefined {
        for (const [player, score] of this.playerScores.entries()) {
            if (score >= this.targetScore) {
                return player
            }
        }
        return undefined
    }

    currentRound(): Round {
        return undefined! as Round;
    }
}

export function createUnoGame(players?: string[], targetScore?: number): Game {
    players = players ?? ['A', 'B']
    targetScore = targetScore ?? 500

    return new UnoGame(players, targetScore)
}

export class GameMemento {
}
