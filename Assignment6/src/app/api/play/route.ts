import { NextRequest, NextResponse } from 'next/server'
import { getGameSession, saveGameSession } from '@/lib/session'
import { play } from '@/lib/game/round'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, cardIndex, namedColor } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        if (cardIndex === undefined || cardIndex === null) {
            return NextResponse.json(
                { error: 'Card index is required' },
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

        // Play the card
        const newRound = play(cardIndex, namedColor, round)
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
        console.error('Error playing card:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to play card' },
            { status: 500 }
        )
    }
}
