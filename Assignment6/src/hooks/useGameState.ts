'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Color } from '@/lib/game/deck'
import { executeBotPlay } from '@/lib/game/botPlayer'

interface RoundState {
    players: string[]
    playerInTurn: number | undefined
    currentColor: Color
    currentDirection: 'clockwise' | 'counterclockwise'
    hands: Card[][]
    discardPile: Card[]
    drawPileCount: number
}

export function useGameState(
    sessionId: string | null,
    isMultiplayer: boolean,
    roomCode: string | null,
    onGameEnd: () => void
) {
    const [roundState, setRoundState] = useState<RoundState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const botPlay = useCallback((currentState: RoundState) => {
        if (!sessionId) return

        executeBotPlay(
            sessionId,
            currentState,
            isMultiplayer,
            roomCode,
            setRoundState,
            onGameEnd,
            (state) => setTimeout(() => botPlay(state), 1000)
        )
    }, [sessionId, isMultiplayer, roomCode, onGameEnd])

    // Fetch initial game state
    useEffect(() => {
        if (!sessionId) return

        const fetchGameState = async () => {
            try {
                const response = await fetch(`/api/state/${sessionId}`)
                if (!response.ok) {
                    throw new Error('Game not found')
                }
                const data = await response.json()
                setRoundState(data.round)
                setLoading(false)

                // If it's a bot's turn, trigger bot play
                if (!isMultiplayer && data.round.playerInTurn !== undefined && data.round.playerInTurn !== 0) {
                    setTimeout(() => botPlay(data.round), 1000)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load game')
                setLoading(false)
            }
        }

        fetchGameState()
    }, [sessionId, isMultiplayer, botPlay])

    // Poll for game state in multiplayer
    useEffect(() => {
        if (!sessionId || !isMultiplayer) return

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/state/${sessionId}`)
                if (response.ok) {
                    const data = await response.json()
                    setRoundState(data.round)

                    // Check if game ended
                    if (data.round.playerInTurn === undefined) {
                        clearInterval(interval)
                    }
                }
            } catch (error) {
                console.error('Error polling game state:', error)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [sessionId, isMultiplayer])

    return { roundState, setRoundState, loading, error, botPlay }
}
