import { NextRequest, NextResponse } from 'next/server'
import { getGameSession } from '@/lib/session'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params

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

        return NextResponse.json({
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
        console.error('Error fetching game state:', error)
        return NextResponse.json(
            { error: 'Failed to fetch game state' },
            { status: 500 }
        )
    }
}
