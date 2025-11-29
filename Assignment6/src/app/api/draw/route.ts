import { NextRequest, NextResponse } from 'next/server'
import { getGameSession, saveGameSession } from '@/lib/session'
import { draw } from '@/lib/game/round'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        const round = getGameSession(sessionId)
        if (!round) {
            return NextResponse.json(
                { error: 'Game session not found' },
                { status: 404 }
            )
        }

        // Draw a card
        const newRound = draw(round)
        saveGameSession(sessionId, newRound)

        return NextResponse.json({
            round: {
                players: newRound.players,
                playerInTurn: newRound.playerInTurn,
                currentColor: newRound.currentColor,
                currentDirection: newRound.currentDirection,
                hands: newRound.hands,
                discardPile: newRound.discardPile,
                drawPileCount: newRound.drawPile.length,
            }
        })
    } catch (error) {
        console.error('Error drawing card:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to draw card' },
            { status: 500 }
        )
    }
}
