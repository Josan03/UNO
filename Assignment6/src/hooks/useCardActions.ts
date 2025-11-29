'use client'

import toast from 'react-hot-toast'
import { Card, Color } from '@/lib/game/deck'
import { RoundState } from '@/store/slices/gameSlice'

export function useCardActions(
    sessionId: string | null,
    roundState: RoundState | null,
    myPlayerIndex: number,
    isMultiplayer: boolean,
    onBotTurn: (state: RoundState) => void,
    onGameEnd: () => void
) {
    const handlePlayCard = async (cardIndex: number, namedColor?: Color) => {
        if (!sessionId || !roundState || roundState.playerInTurn !== myPlayerIndex) return

        try {
            const response = await fetch('/api/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, cardIndex, namedColor }),
            })

            if (!response.ok) {
                const data = await response.json()
                toast.error(data.error || 'Invalid move', {
                    duration: 3000,
                    position: 'top-center',
                    style: {
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px',
                    },
                    icon: '❌',
                })
                return null
            }

            const data = await response.json()

            // Check if game ended
            if (data.round.playerInTurn === undefined) {
                const winnerIndex = data.round.hands.findIndex((h: Card[]) => h.length === 0)
                setTimeout(() => {
                    toast.success(`🎉 ${data.round.players[winnerIndex]} wins!`, {
                        duration: 4000,
                        position: 'top-center',
                        style: {
                            background: '#10b981',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            padding: '20px',
                            borderRadius: '8px',
                        },
                    })
                    setTimeout(() => onGameEnd(), 3000)
                }, 500)
                return data.round
            }

            // Trigger bot play if it's bot's turn in single player mode
            if (!isMultiplayer && data.round.playerInTurn !== 0) {
                setTimeout(() => onBotTurn(data.round), 1000)
            }

            return data.round
        } catch (err) {
            console.error('Play card error:', err)
            toast.error('Failed to play card', {
                duration: 3000,
                position: 'top-center',
            })
            return null
        }
    }

    const handleDrawCard = async () => {
        if (!sessionId || !roundState || roundState.playerInTurn !== myPlayerIndex) return

        try {
            const response = await fetch('/api/draw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            })

            if (!response.ok) {
                const data = await response.json()
                toast.error(data.error || 'Failed to draw card', {
                    duration: 3000,
                    position: 'top-center',
                })
                return null
            }

            const data = await response.json()

            // Trigger bot play if it's bot's turn after draw in single player mode
            if (!isMultiplayer && data.round.playerInTurn !== undefined && data.round.playerInTurn !== 0) {
                setTimeout(() => onBotTurn(data.round), 1000)
            }

            return data.round
        } catch (err) {
            console.error('Draw card error:', err)
            toast.error('Failed to draw card', {
                duration: 3000,
                position: 'top-center',
            })
            return null
        }
    }

    return { handlePlayCard, handleDrawCard }
}
