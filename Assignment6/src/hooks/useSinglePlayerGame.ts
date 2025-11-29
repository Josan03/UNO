'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useSinglePlayerGame() {
    const [loading, setLoading] = useState(false)
    const [playerCount, setPlayerCount] = useState(2)
    const [playerNames, setPlayerNames] = useState<string[]>(['Player', 'Bot-1'])
    const router = useRouter()

    const handlePlayerCountChange = (count: number) => {
        setPlayerCount(count)
        const names: string[] = ['Player']
        for (let i = 1; i < count; i++) {
            names.push(`Bot-${i}`)
        }
        setPlayerNames(names)
    }

    const handlePlayerNameChange = (index: number, name: string) => {
        const newNames = [...playerNames]
        newNames[index] = name
        setPlayerNames(newNames)
    }

    const startGame = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    players: playerNames,
                    cardsPerPlayer: 7,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create game')
            }

            const data = await response.json()
            router.push(`/game/${data.sessionId}`)
        } catch (error) {
            console.error('Error starting game:', error)
            alert('Failed to start game. Please try again.')
            setLoading(false)
        }
    }

    return {
        loading,
        playerCount,
        playerNames,
        handlePlayerCountChange,
        handlePlayerNameChange,
        startGame
    }
}
