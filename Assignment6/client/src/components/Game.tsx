import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { wsSend } from '../store/websocketMiddleware'
import { UnoCard } from './UnoCard'
import { ColorPicker } from './ColorPicker'
import { GameHistory } from './GameHistory'
import { GameResults } from './GameResults'
import { Color } from '@shared/model/deck'

export function Game() {
    const dispatch = useAppDispatch()
    const { game, error, lastEvent } = useAppSelector((state) => state.game)
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
    const [showColorPicker, setShowColorPicker] = useState(false)

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

    const currentColor = game.round?.currentColor ?? 'RED'
    const colorGlow: Record<Color, string> = {
        RED: 'shadow-[0_0_60px_rgba(237,28,36,0.4)]',
        BLUE: 'shadow-[0_0_60px_rgba(0,114,188,0.4)]',
        GREEN: 'shadow-[0_0_60px_rgba(0,166,81,0.4)]',
        YELLOW: 'shadow-[0_0_60px_rgba(255,237,0,0.4)]'
    }
    const colorBg: Record<Color, string> = {
        RED: 'from-uno-red/20',
        BLUE: 'from-uno-blue/20',
        GREEN: 'from-uno-green/20',
        YELLOW: 'from-uno-yellow/20'
    }

    return (
        <div className="min-h-screen p-4 flex flex-col relative">
            {/* Game Results Screen */}
            {gameEnded && winnerInfo && (
                <GameResults
                    winnerIndex={winnerInfo.winner}
                    winnerName={winnerInfo.winnerName}
                    players={game.players}
                    myIndex={game.playerIndex}
                />
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

            {/* Game History - Fixed to right side */}
            <div className="fixed right-4 top-4 z-40">
                <GameHistory />
            </div>

            {/* Turn Indicator - Top center */}
            {game.round && !gameEnded && (
                <div className="text-center mb-4">
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full 
                        ${game.isMyTurn
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                            : 'bg-white/5 border border-white/10'}`}>
                        {game.isMyTurn ? (
                            <>
                                <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                                <span className="text-yellow-400 font-bold text-lg">YOUR TURN</span>
                            </>
                        ) : (
                            <>
                                <span className={`w-3 h-3 rounded-full ${game.players[game.round.playerInTurn ?? 0]?.isBot ? 'bg-purple-400 animate-pulse' : 'bg-white/40'}`} />
                                <span className="text-white/60">
                                    {game.players[game.round.playerInTurn ?? 0]?.isBot ? '🤖 ' : ''}
                                    {game.players[game.round.playerInTurn ?? 0]?.name}'s turn
                                    {game.players[game.round.playerInTurn ?? 0]?.isBot ? ' (thinking...)' : ''}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Opponents */}
            <div className="flex justify-center gap-3 mb-4 flex-wrap">
                {game.players.map((player, index) => {
                    if (index === game.playerIndex) return null
                    const isCurrentTurn = game.round?.playerInTurn === index
                    const hasUno = game.round && game.round.handSizes[index] === 1

                    return (
                        <div
                            key={index}
                            className={`glass rounded-2xl p-4 min-w-[140px] transition-all duration-300 ${isCurrentTurn ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : ''
                                } ${player.isBot ? 'border border-purple-500/30' : ''}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                    ${isCurrentTurn
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                        : player.isBot
                                            ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white'
                                            : 'bg-white/10 text-white/70'}`}>
                                    {player.isBot ? '🤖' : player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-medium text-sm truncate flex-1">
                                    {player.name}
                                </span>
                                {player.isBot && (
                                    <span className="text-purple-400 text-xs" title="Bot">BOT</span>
                                )}
                                {!player.isConnected && !player.isBot && (
                                    <span className="text-red-400 text-xs" title="Disconnected">⚠️</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xl">🃏</span>
                                    <span className="text-white font-bold">{player.cardCount}</span>
                                </div>
                                {hasUno && !gameEnded && !player.isBot && (
                                    <button
                                        onClick={() => handleCatchUno(index)}
                                        className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs 
                                            px-3 py-1.5 rounded-lg font-bold
                                            hover:from-red-600 hover:to-red-700 transition-all animate-pulse"
                                    >
                                        CATCH!
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Game Table */}
            {game.round && (
                <div className={`flex-1 flex items-center justify-center relative table-glow`}>
                    <div className={`flex items-center justify-center gap-12 p-8 rounded-[40px] 
                        bg-gradient-to-br ${colorBg[currentColor]} to-transparent
                        ${colorGlow[currentColor]} transition-all duration-500`}>

                        {/* Draw Pile */}
                        <div className="text-center">
                            <button
                                onClick={handleDraw}
                                disabled={!game.canDrawCard || gameEnded}
                                className={`relative transition-all duration-200 ${game.canDrawCard && !gameEnded
                                    ? 'hover:scale-105 hover:-translate-y-2 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                {/* Stacked cards effect */}
                                <div className="absolute -top-1 -left-1 w-28 h-40 rounded-xl 
                                    bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 opacity-50" />
                                <div className="absolute -top-0.5 -left-0.5 w-28 h-40 rounded-xl 
                                    bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 opacity-75" />
                                <UnoCard
                                    card={{ type: 'NUMBERED', color: 'BLUE', number: 0 }}
                                    faceDown
                                    size="large"
                                />
                            </button>
                            <p className="text-white/50 text-sm mt-3 font-medium">
                                Draw ({game.round.drawPileSize})
                            </p>
                        </div>

                        {/* Discard Pile */}
                        <div className="text-center">
                            <div className="relative">
                                <UnoCard card={game.round.topCard} size="large" />
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${currentColor === 'RED' ? 'bg-uno-red' :
                                    currentColor === 'BLUE' ? 'bg-uno-blue' :
                                        currentColor === 'GREEN' ? 'bg-uno-green' : 'bg-uno-yellow'
                                    }`} />
                                <span className="text-white/70 font-medium">{currentColor}</span>
                            </div>
                        </div>

                        {/* Direction */}
                        <div className="text-center">
                            <div className={`w-16 h-16 rounded-full bg-white/10 flex items-center justify-center
                                border border-white/20`}>
                                <span className="text-4xl text-white/60">
                                    {game.round.currentDirection === 'clockwise' ? '↻' : '↺'}
                                </span>
                            </div>
                            <p className="text-white/40 text-xs mt-2">
                                {game.round.currentDirection === 'clockwise' ? 'Clockwise' : 'Counter'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                    <div className="bg-red-500/20 backdrop-blur-lg border border-red-500/40 
                        rounded-xl px-6 py-3 text-red-300 text-sm font-medium">
                        {error}
                    </div>
                </div>
            )}

            {/* Player's Hand */}
            <div className="glass-dark rounded-3xl p-6 mt-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-lg">Your Hand</span>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm">
                            {game.hand.length} cards
                        </span>
                    </div>
                    {game.hand.length <= 2 && !gameEnded && (() => {
                        const alreadyCalledUno = game.round?.unoCalledBy.includes(game.playerIndex) ?? false
                        return (
                            <button
                                onClick={handleSayUno}
                                disabled={alreadyCalledUno}
                                className={`px-6 py-2.5 rounded-xl font-black text-lg tracking-wide transition-all duration-300 ${alreadyCalledUno
                                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-uno-red to-red-600 text-white hover:shadow-glow-red animate-bounce'
                                    }`}
                            >
                                {alreadyCalledUno ? 'UNO! ✓' : 'UNO!'}
                            </button>
                        )
                    })()}
                </div>

                <div className="flex flex-wrap justify-center gap-3 py-2">
                    {game.hand.map((card, index) => (
                        <div
                            key={index}
                            className="animate-card-deal"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <UnoCard
                                card={card}
                                canPlay={game.isMyTurn && game.canPlayCards[index] && !gameEnded}
                                onClick={() => handleCardClick(index)}
                                size="medium"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
