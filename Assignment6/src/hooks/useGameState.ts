'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAppState, useAppDispatch } from '@/store/hooks'
import { executeBotPlay } from '@/lib/game/botPlayer'
import { RoundState } from '@/store/slices/gameSlice'

export function useGameState(
    sessionId: string | null,
    isMultiplayer: boolean,
    roomCode: string | null,
    onGameEnd: () => void
) {
    const state = useAppState()
    const dispatch = useAppDispatch()
    const { roundState, loading, error } = state.game

    // Use ref to avoid circular dependencies
    const onGameEndRef = useRef(onGameEnd)
    useEffect(() => {
        onGameEndRef.current = onGameEnd
    }, [onGameEnd])

    const updateRoundState = useCallback((newState: RoundState) => {
        dispatch({ type: 'game', action: { type: 'SET_ROUND_STATE', payload: newState } })
    }, [dispatch])

    // Use ref for updateRoundState to break circular dependency
    const updateRoundStateRef = useRef(updateRoundState)
    useEffect(() => {
        updateRoundStateRef.current = updateRoundState
    }, [updateRoundState])

    const botPlay = useCallback((currentState: RoundState) => {
        if (!sessionId) return

        executeBotPlay(
            sessionId,
            currentState,
            isMultiplayer,
            roomCode,
            (state) => updateRoundStateRef.current(state),
            () => onGameEndRef.current(),
            (state) => setTimeout(() => botPlay(state), 1000)
        )
    }, [sessionId, isMultiplayer, roomCode])

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
    }, [sessionId, isMultiplayer, dispatch, botPlay])

    // Poll for game state in multiplayer
    useEffect(() => {
        if (!sessionId || !isMultiplayer) return

        let isPolling = false
        const interval = setInterval(async () => {
            if (isPolling) return // Skip if previous poll still running
            isPolling = true

            try {
                const response = await fetch(`/api/state/${sessionId}`)
                if (response.ok) {
                    const data = await response.json()
                    dispatch({ type: 'game', action: { type: 'SET_ROUND_STATE', payload: data.round } })

                    // Check if game ended
                    if (data.round.playerInTurn === undefined) {
                        clearInterval(interval)
                        return
                    }

                    // In multiplayer, trigger bot play if it's a bot's turn
                    if (isMultiplayer && roomCode && data.round.playerInTurn !== undefined) {
                        try {
                            const roomResponse = await fetch(`/api/room/${roomCode}`)
                            if (roomResponse.ok) {
                                const roomData = await roomResponse.json()
                                const currentPlayer = roomData.room.players[data.round.playerInTurn]
                                if (currentPlayer && currentPlayer.type === 'bot') {
                                    setTimeout(() => botPlay(data.round), 1000)
                                }
                            }
                        } catch (err) {
                            console.error('Error checking player type in polling:', err)
                        }
                    }
                }
            } catch (error) {
                console.error('Error polling game state:', error)
            } finally {
                isPolling = false
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [sessionId, isMultiplayer, dispatch, roomCode, botPlay])

    return { roundState, updateRoundState, loading, error, botPlay }
}
