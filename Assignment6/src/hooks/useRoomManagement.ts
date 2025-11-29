'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Room } from '@/lib/rooms'

export function useRoomManagement() {
    const [loading, setLoading] = useState(false)
    const [room, setRoom] = useState<Room | null>(null)
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const createRoom = async (playerName: string, maxPlayers: number) => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return false
        }

        setLoading(true)
        setError(null)

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
            setRoom(data.room)
            setPlayerId(data.playerId)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room')
            return false
        } finally {
            setLoading(false)
        }
    }

    const joinRoom = async (playerName: string, roomCode: string) => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return false
        }

        if (!roomCode.trim()) {
            setError('Please enter room code')
            return false
        }

        setLoading(true)
        setError(null)

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
            setRoom(data.room)
            setPlayerId(data.playerId)
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room')
            return false
        } finally {
            setLoading(false)
        }
    }

    const toggleReady = async () => {
        if (!room || !playerId) return

        const player = room.players.find(p => p.id === playerId)
        if (!player) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ready', playerId, ready: !player.ready }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error toggling ready:', err)
        } finally {
            setLoading(false)
        }
    }

    const addBot = async () => {
        if (!room) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addBot' }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error adding bot:', err)
        } finally {
            setLoading(false)
        }
    }

    const removeBot = async (botId: string) => {
        if (!room) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeBot', botId }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error removing bot:', err)
        } finally {
            setLoading(false)
        }
    }

    const startGame = async () => {
        if (!room) return

        setLoading(true)
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
            setError(err instanceof Error ? err.message : 'Failed to start game')
            setLoading(false)
        }
    }

    return {
        loading,
        room,
        playerId,
        error,
        setRoom,
        setError,
        createRoom,
        joinRoom,
        toggleReady,
        addBot,
        removeBot,
        startGame
    }
}
