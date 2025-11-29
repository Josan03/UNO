'use client'

import { useEffect, useCallback } from 'react'
import { useAppState, useAppDispatch } from '@/store/hooks'
import { executeBotPlay } from '@/lib/game/botPlayer'

export function useGameState(
    sessionId: string | null,
    isMultiplayer: boolean,
    roomCode: string | null,
    onGameEnd: () => void
) {
    const state = useAppState()
    const dispatch = useAppDispatch()
    const { roundState, loading, error } = state.game

    const updateRoundState = useCallback((newState: any) => {
        dispatch({ type: 'game', action: { type: 'SET_ROUND_STATE', payload: newState } })
    }, [dispatch])

    const botPlay = useCallback((currentState: any) => {
        if (!sessionId) return

        executeBotPlay(
            sessionId,
            currentState,
            isMultiplayer,
            roomCode,
            updateRoundState,
            onGameEnd,
            (state) => setTimeout(() => botPlay(state), 1000)
        )
    }, [sessionId, isMultiplayer, roomCode, onGameEnd, updateRoundState])

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
                dispatch({ type: 'game', action: { type: 'SET_ROUND_STATE', payload: data.round } })
                dispatch({ type: 'game', action: { type: 'SET_LOADING', payload: false } })

                // If it's a bot's turn, trigger bot play
                if (!isMultiplayer && data.round.playerInTurn !== undefined && data.round.playerInTurn !== 0) {
                    setTimeout(() => botPlay(data.round), 1000)
                }
            } catch (err) {
                dispatch({ type: 'game', action: { type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load game' } })
                dispatch({ type: 'game', action: { type: 'SET_LOADING', payload: false } })
            }
        }

        fetchGameState()
    }, [sessionId, isMultiplayer, botPlay, dispatch])

    // Poll for game state in multiplayer
    useEffect(() => {
        if (!sessionId || !isMultiplayer) return

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/state/${sessionId}`)
                if (response.ok) {
                    const data = await response.json()
                    dispatch({ type: 'game', action: { type: 'SET_ROUND_STATE', payload: data.round } })

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
    }, [sessionId, isMultiplayer, dispatch])

    return { roundState, updateRoundState, loading, error, botPlay }
}
