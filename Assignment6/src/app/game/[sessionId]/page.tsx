'use client'

import { useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppState, useAppDispatch } from '@/store/hooks'
import TopBar from '@/components/game/TopBar'
import GameBoard from '@/components/game/GameBoard'
import PlayHistory from '@/components/game/PlayHistory'
import { useGameSession } from '@/hooks/useGameSession'
import { useGameState } from '@/hooks/useGameState'
import { useCardActions } from '@/hooks/useCardActions'
import { Color } from '@/lib/game/deck'

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const state = useAppState()
    const dispatch = useAppDispatch()
    const { roundState, playHistory, loading, error } = state.game

    const {
        sessionId,
        setSessionId: setLocalSessionId,
        myPlayerIndex,
        setMyPlayerIndex,
        roomCode,
        playerId,
        isMultiplayer,
        router
    } = useGameSession()

    // Unwrap params and determine player index
    useEffect(() => {
        params.then(async (p) => {
            setLocalSessionId(p.sessionId)
            dispatch({ type: 'game', action: { type: 'SET_SESSION_ID', payload: p.sessionId } })
            dispatch({ type: 'game', action: { type: 'SET_GAME_MODE', payload: { isMultiplayer, roomCode } } })

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
    }, [params, isMultiplayer, roomCode, playerId, setLocalSessionId, setMyPlayerIndex, dispatch])

    const handleGameEnd = useCallback(() => {
        router.push('/')
    }, [router])

    const { updateRoundState, botPlay } = useGameState(
        sessionId,
        isMultiplayer,
        roomCode,
        handleGameEnd
    )

    const { handlePlayCard, handleDrawCard } = useCardActions(
        sessionId,
        roundState,
        myPlayerIndex,
        isMultiplayer,
        botPlay,
        handleGameEnd
    )

    const onPlayCard = async (cardIndex: number, namedColor?: Color) => {
        const newState = await handlePlayCard(cardIndex, namedColor)
        if (newState) updateRoundState(newState)
    }

    const onDrawCard = async () => {
        const newState = await handleDrawCard()
        if (newState) updateRoundState(newState)
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

    return (
        <div className="w-full min-h-screen p-10 flex flex-col items-center justify-center gap-12 bg-gradient-to-br from-green-700 via-green-800 to-green-900 relative">
            <Toaster />

            <TopBar
                playerCount={roundState.players.length}
                isMultiplayer={isMultiplayer}
                currentPlayerName={roundState.playerInTurn !== undefined ? roundState.players[roundState.playerInTurn] : undefined}
                gameOver={roundState.playerInTurn === undefined}
                onExit={() => router.push('/')}
            />

            <PlayHistory history={playHistory} />

            <GameBoard
                playerCount={roundState.players.length}
                players={roundState.players}
                hands={roundState.hands}
                playerInTurn={roundState.playerInTurn}
                myPlayerIndex={myPlayerIndex}
                opponentIndices={(() => {
                    const indices = []
                    for (let i = 1; i < roundState.players.length; i++) {
                        indices.push((myPlayerIndex + i) % roundState.players.length)
                    }
                    return indices
                })()}
                discardPile={roundState.discardPile}
                currentColor={roundState.currentColor}
                drawPileCount={roundState.drawPileCount}
                onPlayCard={onPlayCard}
                onDrawCard={onDrawCard}
            />
        </div>
    )
}
