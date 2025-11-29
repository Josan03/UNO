'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Room } from '@/lib/rooms'

export function useRoomPolling(
    mode: string,
    room: Room | null,
    playerId: string | null,
    setRoom: (room: Room) => void
) {
    const router = useRouter()

    useEffect(() => {
        if (mode === 'waiting' && room) {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/room/${room.code}`)
                    if (response.ok) {
                        const data = await response.json()
                        setRoom(data.room)

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
    }, [mode, room, playerId, router, setRoom])
}
