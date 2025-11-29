'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Color } from '@/lib/game/deck'
import toast, { Toaster } from 'react-hot-toast'
import TopBar from '@/components/game/TopBar'
import GameBoard from '@/components/game/GameBoard'

interface RoundState {
    players: string[]
    playerInTurn: number | undefined
    currentColor: Color
    currentDirection: 'clockwise' | 'counterclockwise'
    hands: Card[][]
    discardPile: Card[]
    drawPileCount: number
}

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [roundState, setRoundState] = useState<RoundState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const roomCode = searchParams.get('roomCode')
    const playerId = searchParams.get('playerId')
    const isMultiplayer = !!roomCode && !!playerId

    // Unwrap params and determine player index
    useEffect(() => {
        params.then(async (p) => {
            setSessionId(p.sessionId)

            // If multiplayer, fetch room to get player index
            if (isMultiplayer && roomCode && playerId) {
                try {
                    const response = await fetch(`/api/room/${roomCode}`)
                    if (response.ok) {
                        const data = await response.json()
                        const playerIdx = data.room.players.findIndex((player: { id: string }) => player.id === playerId)
                        if (playerIdx !== -1) {
                            setMyPlayerIndex(playerIdx)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching room:', error)
                }
            }
        })
    }, [params, isMultiplayer, roomCode, playerId])

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

                // If it's a bot's turn, trigger bot play (in single player, all non-0 are bots)
                if (!isMultiplayer && data.round.playerInTurn !== undefined && data.round.playerInTurn !== 0) {
                    setTimeout(() => botPlay(data.round), 1000)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load game')
                setLoading(false)
            }
        }

        fetchGameState()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, isMultiplayer])

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
        }, 1500) // Poll every 1.5 seconds

        return () => clearInterval(interval)
    }, [sessionId, isMultiplayer])

    const botPlay = async (currentState: RoundState) => {
        if (!sessionId) return

        // In multiplayer, check if current player is a bot by fetching room info
        if (isMultiplayer && roomCode) {
            try {
                const roomResponse = await fetch(`/api/room/${roomCode}`)
                if (roomResponse.ok) {
                    const roomData = await roomResponse.json()
                    const currentPlayer = roomData.room.players[currentState.playerInTurn!]

                    // Only play if it's actually a bot's turn
                    if (!currentPlayer || currentPlayer.type !== 'bot') {
                        return
                    }
                }
            } catch (error) {
                console.error('Error checking player type:', error)
                return
            }
        }

        // In single player mode, only play if it's not player 0's turn
        if (!isMultiplayer && (currentState.playerInTurn === undefined || currentState.playerInTurn === 0)) {
            return
        }

        try {
            // Simple bot strategy: play first valid card or draw
            const botHand = currentState.hands[currentState.playerInTurn!]
            const topCard = currentState.discardPile[0]

            // Find first playable card (simplified logic)
            let playableIndex = -1
            for (let i = 0; i < botHand.length; i++) {
                const card = botHand[i]
                if (
                    card.type === 'WILD' ||
                    card.type === 'WILD DRAW' ||
                    card.color === currentState.currentColor ||
                    (card.type === topCard.type && card.type === 'NUMBERED' && card.number === topCard.number) ||
                    (card.type === topCard.type && card.type !== 'NUMBERED')
                ) {
                    playableIndex = i
                    break
                }
            }

            if (playableIndex >= 0) {
                const card = botHand[playableIndex]
                const namedColor = card.type === 'WILD' || card.type === 'WILD DRAW'
                    ? ['RED', 'GREEN', 'BLUE', 'YELLOW'][Math.floor(Math.random() * 4)] as Color
                    : undefined

                const response = await fetch('/api/play', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, cardIndex: playableIndex, namedColor }),
                })

                if (response.ok) {
                    const data = await response.json()
                    setRoundState(data.round)

                    // Check if game ended
                    if (data.round.playerInTurn === undefined) {
                        const winnerIndex = data.round.hands.findIndex((h: Card[]) => h.length === 0)
                        setTimeout(() => {
                            alert(`🎉 ${data.round.players[winnerIndex]} wins!`)
                            router.push('/')
                        }, 500)
                        return
                    }

                    // Continue bot turns in single player
                    if (!isMultiplayer && data.round.playerInTurn !== 0) {
                        setTimeout(() => botPlay(data.round), 1000)
                    }
                }
            } else {
                // Draw a card
                const response = await fetch('/api/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                })

                if (response.ok) {
                    const data = await response.json()
                    setRoundState(data.round)

                    // Check if still bot's turn in single player
                    if (!isMultiplayer && data.round.playerInTurn !== 0 && data.round.playerInTurn !== undefined) {
                        setTimeout(() => botPlay(data.round), 1000)
                    }
                }
            }
        } catch (err) {
            console.error('Bot play error:', err)
        }
    }

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
                return
            }

            const data = await response.json()
            setRoundState(data.round)

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
                    setTimeout(() => router.push('/'), 3000)
                }, 500)
                return
            }

            // Trigger bot play if it's bot's turn in single player mode
            if (!isMultiplayer && data.round.playerInTurn !== 0) {
                setTimeout(() => botPlay(data.round), 1000)
            }
        } catch (err) {
            console.error('Play card error:', err)
            toast.error('Failed to play card', {
                duration: 3000,
                position: 'top-center',
            })
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
                return
            }

            const data = await response.json()
            setRoundState(data.round)

            // If still player's turn after drawing, they can play the drawn card
        } catch (err) {
            console.error('Draw card error:', err)
            toast.error('Failed to draw card', {
                duration: 3000,
                position: 'top-center',
            })
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="text-white text-2xl">Loading game...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="text-white text-2xl">{error}</div>
            </div>
        )
    }

    if (!roundState) return null

    const playerCount = roundState.players.length

    // Calculate opponent indices relative to myPlayerIndex
    const getOpponentIndices = () => {
        const indices = []
        for (let i = 1; i < playerCount; i++) {
            indices.push((myPlayerIndex + i) % playerCount)
        }
        return indices
    }

    const opponentIndices = getOpponentIndices()

    return (
        <div className="w-full min-h-screen p-10 flex flex-col items-center justify-center gap-12 bg-gradient-to-br from-green-700 via-green-800 to-green-900">
            <Toaster />

            <TopBar
                playerCount={playerCount}
                isMultiplayer={isMultiplayer}
                currentPlayerName={roundState.playerInTurn !== undefined ? roundState.players[roundState.playerInTurn] : undefined}
                gameOver={roundState.playerInTurn === undefined}
                onExit={() => router.push('/')}
            />

            <GameBoard
                playerCount={playerCount}
                players={roundState.players}
                hands={roundState.hands}
                playerInTurn={roundState.playerInTurn}
                myPlayerIndex={myPlayerIndex}
                opponentIndices={opponentIndices}
                discardPile={roundState.discardPile}
                currentColor={roundState.currentColor}
                drawPileCount={roundState.drawPileCount}
                onPlayCard={handlePlayCard}
                onDrawCard={handleDrawCard}
            />
        </div>
    )
}
