'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setPlayerName } from '@/store/gameSlice'
import { wsConnect, wsSend } from '@/store/websocketMiddleware'

interface LobbyClientProps {
  lobbyId: string
  playerName: string
  isCreating: boolean
  maxPlayers: number
}

export default function LobbyClient({ lobbyId, playerName, isCreating, maxPlayers }: LobbyClientProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { lobby, game, connectionStatus, error } = useAppSelector((state) => state.game)
  const [copied, setCopied] = useState(false)
  const [hasConnected, setHasConnected] = useState(false)

  useEffect(() => {
    // Set player name in Redux store
    dispatch(setPlayerName(playerName))

    // Connect to WebSocket
    if (connectionStatus !== 'connected' && !hasConnected) {
      const wsUrl = typeof window !== 'undefined' 
        ? `ws://${window.location.hostname}:3001`
        : 'ws://localhost:3001'
      dispatch(wsConnect(wsUrl))
      setHasConnected(true)
    }
  }, [dispatch, playerName, connectionStatus, hasConnected])

  useEffect(() => {
    // Once connected, create or join lobby
    if (connectionStatus === 'connected' && !lobby && !game) {
      if (isCreating) {
        dispatch(wsSend({
          type: 'CREATE_LOBBY',
          payload: { playerName, maxPlayers, lobbyId }
        }))
      } else {
        dispatch(wsSend({
          type: 'JOIN_LOBBY',
          payload: { playerName, lobbyId }
        }))
      }
    }
  }, [connectionStatus, lobby, game, isCreating, playerName, maxPlayers, lobbyId, dispatch])

  useEffect(() => {
    // Redirect to game when game starts
    if (game) {
      router.push(`/game/${lobbyId}`)
    }
  }, [game, lobbyId, router])

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 w-full max-w-lg shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">
              {connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'connected' ? (isCreating ? 'Creating lobby...' : 'Joining lobby...') :
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

  const isHost = lobby.players[lobby.hostIndex] === playerName
  const canStart = lobby.players.length >= 2
  const canAddBot = lobby.players.length < lobby.maxPlayers

  const handleStartGame = () => {
    dispatch(wsSend({ type: 'START_GAME', payload: {} }))
  }

  const handleAddBot = (difficulty: 'easy' | 'medium' | 'hard') => {
    dispatch(wsSend({ type: 'ADD_BOT', payload: { difficulty } }))
  }

  const handleRemoveBot = (botIndex: number) => {
    dispatch(wsSend({ type: 'REMOVE_BOT', payload: { botIndex } }))
  }

  const copyLobbyCode = async () => {
    await navigator.clipboard.writeText(lobby.lobbyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isBot = (index: number) => lobby.botPlayers?.includes(index) ?? false

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-1">Game Lobby</h2>
          <p className="text-white/50 text-sm">Waiting for players...</p>
        </div>

        {/* Room Code */}
        <div className="mb-8">
          <div className="glass-dark rounded-2xl p-6 text-center">
            <p className="text-white/50 text-xs font-semibold tracking-wider mb-2">ROOM CODE</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black text-white tracking-[0.2em] font-mono">
                {lobby.lobbyId}
              </span>
              <button
                onClick={copyLobbyCode}
                className={`p-2.5 rounded-xl transition-all duration-200 ${copied
                  ? 'bg-uno-green/20 text-uno-green'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
                title="Copy code"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-white/30 text-xs mt-2">Share this code with friends</p>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-sm font-semibold tracking-wide">PLAYERS</span>
            <span className="text-white/50 text-sm">
              {lobby.players.length} / {lobby.maxPlayers}
            </span>
          </div>

          <div className="space-y-2">
            {lobby.players.map((player, index) => {
              const isMe = player === playerName
              const isHostPlayer = index === lobby.hostIndex
              const isBotPlayer = isBot(index)

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    isMe
                      ? 'bg-gradient-to-r from-uno-blue/30 to-blue-600/20 border border-uno-blue/30'
                      : isBotPlayer
                        ? 'bg-gradient-to-r from-purple-500/20 to-violet-600/10 border border-purple-500/20'
                        : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isMe ? 'bg-uno-blue/40 text-white' :
                    isBotPlayer ? 'bg-purple-500/40 text-white' :
                    'bg-white/10 text-white/70'
                  }`}>
                    {isBotPlayer ? '🤖' : player.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{player}</span>
                      {isHostPlayer && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-uno-yellow/20 text-uno-yellow border border-uno-yellow/30 font-bold">
                          HOST
                        </span>
                      )}
                      {isMe && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-uno-blue/20 text-uno-blue border border-uno-blue/30 font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {isHost && isBotPlayer && (
                    <button
                      onClick={() => handleRemoveBot(index)}
                      className="p-2 rounded-lg bg-uno-red/20 text-uno-red hover:bg-uno-red/30 transition-colors"
                      title="Remove bot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-3">
            {canAddBot && (
              <div className="glass-dark rounded-xl p-4">
                <p className="text-white/70 text-sm font-semibold mb-2">Add Bot Player</p>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => handleAddBot(difficulty)}
                      className="flex-1 py-2 rounded-lg font-semibold text-xs
                        bg-purple-500/20 text-purple-300 border border-purple-500/30
                        hover:bg-purple-500/30 transition-colors uppercase"
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full py-3.5 rounded-xl font-bold text-white 
                bg-gradient-to-r from-uno-green to-green-600 
                hover:from-uno-green/90 hover:to-green-600/90
                disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {canStart ? 'START GAME' : 'NEED AT LEAST 2 PLAYERS'}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="text-center py-3">
            <p className="text-white/50 text-sm">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  )
}
