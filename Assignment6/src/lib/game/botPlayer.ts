'use client'

import { Card, Color } from '@/lib/game/deck'

interface RoundState {
    players: string[]
    playerInTurn: number | undefined
    currentColor: Color
    currentDirection: 'clockwise' | 'counterclockwise'
    hands: Card[][]
    discardPile: Card[]
    drawPileCount: number
}

export async function executeBotPlay(
    sessionId: string,
    currentState: RoundState,
    isMultiplayer: boolean,
    roomCode: string | null,
    setRoundState: (state: RoundState) => void,
    onGameEnd: () => void,
    onContinueBotTurn: (state: RoundState) => void
) {
    // In multiplayer, check if current player is a bot
    if (isMultiplayer && roomCode) {
        try {
            const roomResponse = await fetch(`/api/room/${roomCode}`)
            if (roomResponse.ok) {
                const roomData = await roomResponse.json()
                const currentPlayer = roomData.room.players[currentState.playerInTurn!]

                if (!currentPlayer || currentPlayer.type !== 'bot') {
                    return
                }
            }
        } catch (error) {
            console.error('Error checking player type:', error)
            return
        }
    }

    // In single player mode, only play if it's not player 0's turn
    if (!isMultiplayer && (currentState.playerInTurn === undefined || currentState.playerInTurn === 0)) {
        return
    }

    try {
        const botHand = currentState.hands[currentState.playerInTurn!]
        const topCard = currentState.discardPile[0]

        // Find first playable card
        let playableIndex = -1
        for (let i = 0; i < botHand.length; i++) {
            const card = botHand[i]
            if (
                card.type === 'WILD' ||
                card.type === 'WILD DRAW' ||
                card.color === currentState.currentColor ||
                (card.type === topCard.type && card.type === 'NUMBERED' && card.number === topCard.number) ||
                (card.type === topCard.type && card.type !== 'NUMBERED')
            ) {
                playableIndex = i
                break
            }
        }

        if (playableIndex >= 0) {
            const card = botHand[playableIndex]
            const namedColor = card.type === 'WILD' || card.type === 'WILD DRAW'
                ? ['RED', 'GREEN', 'BLUE', 'YELLOW'][Math.floor(Math.random() * 4)] as Color
                : undefined

            const response = await fetch('/api/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, cardIndex: playableIndex, namedColor }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoundState(data.round)

                // Check if game ended
                if (data.round.playerInTurn === undefined) {
                    onGameEnd()
                    return
                }

                // Continue bot turns in single player
                if (!isMultiplayer && data.round.playerInTurn !== 0) {
                    onContinueBotTurn(data.round)
                }
            }
        } else {
            // Draw a card
            const response = await fetch('/api/draw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoundState(data.round)

                // Check if still bot's turn in single player
                if (!isMultiplayer && data.round.playerInTurn !== 0 && data.round.playerInTurn !== undefined) {
                    onContinueBotTurn(data.round)
                }
            }
        }
    } catch (err) {
        console.error('Bot play error:', err)
    }
}
