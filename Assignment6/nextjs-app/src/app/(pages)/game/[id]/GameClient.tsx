'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setPlayerName } from '@/store/gameSlice'
import { wsConnect, wsSend } from '@/store/websocketMiddleware'
import { UnoCard } from '@/components/UnoCard'
import { ColorPicker } from '@/components/ColorPicker'
import { GameHistory } from '@/components/GameHistory'
import { GameResults } from '@/components/GameResults'
import { Color } from '@shared/model/deck'

interface GameClientProps {
  lobbyId: string
  playerName: string
}

export default function GameClient({ lobbyId, playerName }: GameClientProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { game, connectionStatus, error, lastEvent } = useAppSelector((state) => state.game)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hasConnected, setHasConnected] = useState(false)

  const gameEnded = lastEvent?.type === 'GAME_ENDED'
  const winnerInfo = gameEnded ? lastEvent.payload : null

  useEffect(() => {
    // Set player name in Redux store
    dispatch(setPlayerName(playerName))

    // Connect to WebSocket if not connected
    if (connectionStatus !== 'connected' && !hasConnected) {
      const wsUrl = typeof window !== 'undefined' 
        ? `ws://${window.location.hostname}:3001`
        : 'ws://localhost:3001'
      dispatch(wsConnect(wsUrl))
      setHasConnected(true)
    }
  }, [dispatch, playerName, connectionStatus, hasConnected])

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 w-full max-w-lg shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">
              {connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'connected' ? 'Loading game...' :
               'Loading...'}
            </p>
            {error && (
              <p className="text-uno-red mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

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

      {/* Top Bar - Opponents */}
      <div className="mb-4">
        <div className="flex justify-center gap-3 flex-wrap">
          {game.opponents.map((opponent, idx) => {
            const opponentIndex = game.playerIndex === 0 ? idx + 1 : 
                                  idx >= game.playerIndex ? idx + 1 : idx
            const isCurrentPlayer = opponentIndex === game.currentPlayerIndex
            const hasUno = opponent.cardCount === 1 && opponent.saidUno
            const shouldCatchUno = opponent.cardCount === 1 && !opponent.saidUno && !isCurrentPlayer
            
            return (
              <div 
                key={idx}
                className={`glass-dark rounded-2xl p-4 transition-all duration-300 ${
                  isCurrentPlayer ? 'ring-2 ring-uno-yellow shadow-lg scale-105' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCurrentPlayer ? 'bg-uno-yellow/40 text-white animate-pulse' : 'bg-white/10 text-white/70'
                  }`}>
                    {opponent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{opponent.name}</span>
                      {hasUno && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-uno-red/20 text-uno-red border border-uno-red/30 font-bold">
                          UNO!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/50 text-xs">{opponent.cardCount} cards</span>
                      {shouldCatchUno && (
                        <button
                          onClick={() => handleCatchUno(opponentIndex)}
                          className="text-xs px-2 py-0.5 rounded-full bg-uno-red/30 text-white 
                            hover:bg-uno-red/50 transition-colors font-bold animate-pulse"
                        >
                          CATCH!
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Center - Discard Pile and Deck */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8">
          {/* Draw Pile */}
          <div className="relative group">
            <button
              onClick={handleDraw}
              disabled={!game.canDrawCard || gameEnded}
              className={`relative transition-all duration-300 ${
                game.canDrawCard && !gameEnded
                  ? 'hover:scale-110 cursor-pointer active:scale-95'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl blur-sm"></div>
              <div className="relative">
                <UnoCard color="RED" type="0" faceDown className="transform rotate-2" />
              </div>
              {game.canDrawCard && !gameEnded && (
                <div className="absolute -top-2 -right-2 bg-uno-blue text-white text-xs font-bold 
                  w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                  ?
                </div>
              )}
            </button>
            <p className="text-white/50 text-xs text-center mt-2 font-semibold">DRAW</p>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-2xl blur-xl ${colorGlow[currentColor]}`}></div>
            <div className="relative">
              {game.round?.topCard && (
                <UnoCard {...game.round.topCard} className="transform -rotate-3" />
              )}
            </div>
            <p className="text-white/50 text-xs text-center mt-2 font-semibold">DISCARD</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Player's Hand */}
      <div className={`bg-gradient-to-t ${colorBg[currentColor]} to-transparent rounded-t-3xl p-6 -mx-4 -mb-4`}>
        {/* Player Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
              game.isMyTurn ? 'bg-uno-yellow/40 text-white animate-pulse' : 'bg-white/10 text-white/70'
            }`}>
              {game.players[game.playerIndex].charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{game.players[game.playerIndex]}</span>
                {game.isMyTurn && (
                  <span className="text-xs px-2 py-1 rounded-full bg-uno-yellow/30 text-white font-bold animate-pulse">
                    YOUR TURN
                  </span>
                )}
              </div>
              <span className="text-white/50 text-sm">{game.hand.length} cards</span>
            </div>
          </div>

          {/* UNO Button */}
          {game.hand.length === 1 && !gameEnded && (
            <button
              onClick={handleSayUno}
              className="px-6 py-3 rounded-xl font-black text-2xl text-white 
                bg-gradient-to-r from-uno-red to-red-700
                hover:from-uno-red/90 hover:to-red-700/90
                shadow-lg hover:shadow-xl transition-all duration-200
                transform hover:scale-105 active:scale-95 animate-pulse"
            >
              UNO!
            </button>
          )}
        </div>

        {/* Cards */}
        <div className="flex justify-center gap-2 flex-wrap max-w-6xl mx-auto">
          {game.hand.map((card, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={!game.canPlayCards[index] || !game.isMyTurn || gameEnded}
              className={`transition-all duration-200 ${
                game.canPlayCards[index] && game.isMyTurn && !gameEnded
                  ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer active:scale-105'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <UnoCard {...card} />
            </button>
          ))}
        </div>
      </div>

      {/* Game History */}
      <GameHistory />
    </div>
  )
}
