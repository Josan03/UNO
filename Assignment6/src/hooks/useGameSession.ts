'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useGameSession() {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const roomCode = searchParams.get('roomCode')
    const playerId = searchParams.get('playerId')
    const isMultiplayer = !!roomCode && !!playerId

    return {
        sessionId,
        setSessionId,
        myPlayerIndex,
        setMyPlayerIndex,
        roomCode,
        playerId,
        isMultiplayer,
        router
    }
}
