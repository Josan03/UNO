import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { wsSend } from '../store/websocketMiddleware'
import { UnoCard } from './UnoCard'
import { ColorPicker } from './ColorPicker'
import { Color } from '@shared/model/deck'

export function Game() {
    const dispatch = useAppDispatch()
    const { game, error, lastEvent } = useAppSelector((state) => state.game)
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
    const [showColorPicker, setShowColorPicker] = useState(false)

    // Check if game has ended
    const gameEnded = lastEvent?.type === 'GAME_ENDED'
    const winnerInfo = gameEnded ? lastEvent.payload : null

    if (!game) return null

    const handleCardClick = (index: number) => {
        if (!game.isMyTurn || !game.canPlayCards[index] || gameEnded) return

        const card = game.hand[index]
        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            setSelectedCardIndex(index)
            setShowColorPicker(true)
        } else {
            dispatch(wsSend({
                type: 'PLAY_CARD',
                payload: { cardIndex: index }
            }))
        }
    }

    const handleColorSelect = (color: Color) => {
        if (selectedCardIndex !== null) {
            dispatch(wsSend({
                type: 'PLAY_CARD',
                payload: { cardIndex: selectedCardIndex, namedColor: color }
            }))
        }
        setShowColorPicker(false)
        setSelectedCardIndex(null)
    }

    const handleDraw = () => {
        if (!game.canDrawCard || gameEnded) return
        dispatch(wsSend({ type: 'DRAW_CARD', payload: {} }))
    }

    const handleSayUno = () => {
        if (gameEnded) return
        dispatch(wsSend({ type: 'SAY_UNO', payload: {} }))
    }

    const handleCatchUno = (playerIndex: number) => {
        if (gameEnded) return
        dispatch(wsSend({
            type: 'CATCH_UNO',
            payload: { accusedPlayerIndex: playerIndex }
        }))
    }

    const handleReturnToLobby = () => {
        dispatch(wsSend({ type: 'RETURN_TO_LOBBY', payload: {} }))
    }

    const currentColor = game.round?.currentColor ?? 'RED'
    const colorBorder: Record<Color, string> = {
        RED: 'border-uno-red',
        BLUE: 'border-uno-blue',
        GREEN: 'border-uno-green',
        YELLOW: 'border-uno-yellow'
    }

    const isWinner = winnerInfo?.winner === game.playerIndex

    return (
        <div className="min-h-screen p-4 flex flex-col">
            {/* Winner Modal */}
            {gameEnded && winnerInfo && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
                        <div className="text-6xl mb-4">
                            {isWinner ? '🏆' : '😔'}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {isWinner ? 'You Won!' : 'Game Over'}
                        </h2>
                        <p className="text-white/60 mb-6">
                            {isWinner
                                ? 'Congratulations! You played all your cards!'
                                : `${winnerInfo.winnerName} wins!`}
                        </p>
                        <button
                            onClick={handleReturnToLobby}
                            className="w-full py-3 rounded-lg bg-uno-blue text-white font-semibold
                                     hover:bg-blue-700 transition-colors"
                        >
                            Return to Lobby
                        </button>
                    </div>
                </div>
            )}

            {showColorPicker && (
                <ColorPicker
                    onSelect={handleColorSelect}
                    onCancel={() => {
                        setShowColorPicker(false)
                        setSelectedCardIndex(null)
                    }}
                />
            )}

            {/* Top: Opponents */}
            <div className="flex justify-center gap-4 mb-4">
                {game.players.map((player, index) => {
                    if (index === game.playerIndex) return null
                    const isCurrentTurn = game.round?.playerInTurn === index
                    const hasUno = game.round && game.round.handSizes[index] === 1

                    return (
                        <div
                            key={index}
                            className={`bg-white/10 rounded-xl p-3 min-w-[120px] ${isCurrentTurn ? 'ring-2 ring-yellow-400' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium text-sm truncate">
                                    {player.name}
                                </span>
                                {!player.isConnected && (
                                    <span className="text-red-400 text-xs">⚠️</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/60 text-sm">
                                    🃏 {player.cardCount}
                                </span>
                                {hasUno && !gameEnded && (
                                    <button
                                        onClick={() => handleCatchUno(index)}
                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded
                               hover:bg-red-600 transition-colors animate-pulse"
                                    >
                                        Catch!
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Middle: Game board */}
            {game.round && (
                <div className="flex-1 flex items-center justify-center gap-8">
                    {/* Draw pile */}
                    <div className="text-center">
                        <button
                            onClick={handleDraw}
                            disabled={!game.canDrawCard || gameEnded}
                            className={`transition-transform ${game.canDrawCard && !gameEnded ? 'hover:scale-105 cursor-pointer' : 'opacity-60'
                                }`}
                        >
                            <UnoCard
                                card={{ type: 'NUMBERED', color: 'BLUE', number: 0 }}
                                faceDown
                                size="large"
                            />
                        </button>
                        <div className="text-white/60 text-sm mt-2">
                            Draw ({game.round.drawPileSize})
                        </div>
                    </div>

                    {/* Discard pile */}
                    <div className={`text-center p-4 rounded-2xl border-4 ${colorBorder[currentColor]}`}>
                        <UnoCard card={game.round.topCard} size="large" />
                        <div className="text-white/60 text-sm mt-2">
                            {currentColor}
                        </div>
                    </div>

                    {/* Direction indicator */}
                    <div className="text-4xl text-white/40">
                        {game.round.currentDirection === 'clockwise' ? '↻' : '↺'}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 text-red-300 text-sm text-center mx-auto max-w-md">
                    {error}
                </div>
            )}

            {/* Turn indicator */}
            {game.round && !gameEnded && (
                <div className="text-center mb-4">
                    {game.isMyTurn ? (
                        <span className="text-yellow-400 font-bold text-lg animate-pulse">
                            Your Turn!
                        </span>
                    ) : (
                        <span className="text-white/60">
                            {game.players[game.round.playerInTurn ?? 0]?.name}'s turn
                        </span>
                    )}
                </div>
            )}

            {/* Bottom: Player's hand */}
            <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">
                        Your Hand ({game.hand.length} cards)
                    </span>
                    {game.hand.length <= 2 && !gameEnded && (() => {
                        const alreadyCalledUno = game.round?.unoCalledBy.includes(game.playerIndex) ?? false
                        return (
                            <button
                                onClick={handleSayUno}
                                disabled={alreadyCalledUno}
                                className={`px-4 py-2 rounded-lg font-bold transition-colors ${alreadyCalledUno
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-uno-red text-white hover:bg-red-700 animate-bounce'
                                    }`}
                            >
                                {alreadyCalledUno ? 'UNO! ✓' : 'UNO!'}
                            </button>
                        )
                    })()}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                    {game.hand.map((card, index) => (
                        <UnoCard
                            key={index}
                            card={card}
                            canPlay={game.isMyTurn && game.canPlayCards[index] && !gameEnded}
                            onClick={() => handleCardClick(index)}
                            size="medium"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
