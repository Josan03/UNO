'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { Room } from '@/lib/rooms'

export function useRoomPolling(
    mode: string,
    room: Room | null,
    playerId: string | null
) {
    const router = useRouter()
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (mode === 'waiting' && room) {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/room/${room.code}`)
                    if (response.ok) {
                        const data = await response.json()
                        dispatch({ type: 'room', action: { type: 'SET_ROOM', payload: data.room } })

                        // If game started, redirect to game
                        if (data.room.status === 'playing' && data.room.sessionId) {
                            router.push(`/game/${data.room.sessionId}?roomCode=${data.room.code}&playerId=${playerId}`)
                        }
                    }
                } catch (error) {
                    console.error('Error polling room:', error)
                }
            }, 1000) // Poll every second

            return () => clearInterval(interval)
        }
    }, [mode, room, playerId, router, dispatch])
}
