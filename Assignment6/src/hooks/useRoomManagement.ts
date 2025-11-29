'use client'

import { useRouter } from 'next/navigation'
import { useAppState, useAppDispatch } from '@/store/hooks'

export function useRoomManagement() {
    const state = useAppState()
    const dispatch = useAppDispatch()
    const { room, playerId, loading, error } = state.room
    const router = useRouter()

    const createRoom = async (playerName: string, maxPlayers: number) => {
        if (!playerName.trim()) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: 'Please enter your name' } })
            return false
        }

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: null } })

        try {
            const response = await fetch('/api/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostName: playerName, maxPlayers }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create room')
            }

            const data = await response.json()
            dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })
            dispatch({ type: 'room', action: { type: 'SET_PLAYER_ID', payload: data.playerId } })
            return true
        } catch (err) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create room' } })
            return false
        } finally {
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    const joinRoom = async (playerName: string, roomCode: string) => {
        if (!playerName.trim()) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: 'Please enter your name' } })
            return false
        }

        if (!roomCode.trim()) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: 'Please enter room code' } })
            return false
        }

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: null } })

        try {
            const response = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode, playerName }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to join room')
            }

            const data = await response.json()
            dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })
            dispatch({ type: 'room', action: { type: 'SET_PLAYER_ID', payload: data.playerId } })
            return true
        } catch (err) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to join room' } })
            return false
        } finally {
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    const toggleReady = async () => {
        if (!room || !playerId) return

        const player = room.players.find((p: { id: string }) => p.id === playerId)
        if (!player) return

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ready', playerId, ready: !player.ready }),
            })

            if (response.ok) {
                const data = await response.json()
                dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })
            }
        } catch (err) {
            console.error('Error toggling ready:', err)
        } finally {
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    const addBot = async () => {
        if (!room) return

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addBot' }),
            })

            if (response.ok) {
                const data = await response.json()
                dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })
            }
        } catch (err) {
            console.error('Error adding bot:', err)
        } finally {
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    const removeBot = async (botId: string) => {
        if (!room) return

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeBot', botId }),
            })

            if (response.ok) {
                const data = await response.json()
                dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })
            }
        } catch (err) {
            console.error('Error removing bot:', err)
        } finally {
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    const startGame = async () => {
        if (!room) return

        dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: true } })
        try {
            const response = await fetch('/api/room/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: room.code }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to start game')
            }

            const data = await response.json()
            router.push(`/game/${data.sessionId}?roomCode=${data.room.code}&playerId=${playerId}`)
        } catch (err) {
            dispatch({ type: 'room', action: { type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to start game' } })
            dispatch({ type: 'room', action: { type: 'SET_LOADING', payload: false } })
        }
    }

    return {
        loading,
        room,
        playerId,
        error,
        createRoom,
        joinRoom,
        toggleReady,
        addBot,
        removeBot,
        startGame
    }
}
