import { NextRequest, NextResponse } from 'next/server'
import { createRound } from '@/lib/game/round'
import { generateSessionId, saveGameSession } from '@/lib/session'
import { standardShuffler } from '@/lib/game/random_utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { players, cardsPerPlayer = 7 } = body

        if (!players || !Array.isArray(players) || players.length < 2 || players.length > 10) {
            return NextResponse.json(
                { error: 'Invalid players. Must be an array with 2-10 player names.' },
                { status: 400 }
            )
        }

        // Create a new round with dealer at position 0
        const dealer = 0
        const round = createRound(players, dealer, standardShuffler, cardsPerPlayer)

        // Generate session ID and save
        const sessionId = generateSessionId()
        saveGameSession(sessionId, round)

        return NextResponse.json({
            sessionId,
            round: {
                players: round.players,
                playerInTurn: round.playerInTurn,
                currentColor: round.currentColor,
                currentDirection: round.currentDirection,
                hands: round.hands,
                discardPile: round.discardPile,
                drawPileCount: round.drawPile.length,
            }
        })
    } catch (error) {
        console.error('Error creating game:', error)
        return NextResponse.json(
            { error: 'Failed to create game' },
            { status: 500 }
        )
    }
}
