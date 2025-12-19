'use client'

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { wsSend } from '@/store/websocketMiddleware'

export function Lobby() {
    const dispatch = useAppDispatch()
    const { lobby, playerName, error } = useAppSelector((state) => state.game)
    const [copied, setCopied] = useState(false)

    if (!lobby) return null

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
                                    className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${isMe
                                        ? 'bg-gradient-to-r from-uno-blue/30 to-blue-600/20 border border-uno-blue/30'
                                        : isBotPlayer
                                            ? 'bg-gradient-to-r from-purple-500/20 to-violet-600/10 border border-purple-500/20'
                                            : 'bg-white/5 border border-white/5'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                        ${isHostPlayer
                                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                            : isBotPlayer
                                                ? 'bg-gradient-to-br from-purple-500 to-violet-600'
                                                : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}>
                                        {isHostPlayer ? (
                                            <span className="text-lg">ðŸ‘‘</span>
                                        ) : isBotPlayer ? (
                                            <span className="text-lg">ðŸ¤–</span>
                                        ) : (
                                            <span className="text-white font-bold">{player.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white font-semibold">{player}</span>
                                        {isMe && (
                                            <span className="text-uno-blue text-xs ml-2">(You)</span>
                                        )}
                                        {isHostPlayer && !isBotPlayer && (
                                            <span className="text-yellow-400 text-xs ml-2">Host</span>
                                        )}
                                        {isBotPlayer && (
                                            <span className="text-purple-400 text-xs ml-2">Bot</span>
                                        )}
                                    </div>
                                    {isBotPlayer && isHost && (
                                        <button
                                            onClick={() => handleRemoveBot(index)}
                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            title="Remove bot"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <div className={`w-3 h-3 rounded-full ${isMe ? 'bg-uno-green shadow-glow-green' : isBotPlayer ? 'bg-purple-400' : 'bg-uno-green/60'
                                        }`} />
                                </div>
                            )
                        })}

                        {/* Empty slots */}
                        {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, index) => (
                            <div
                                key={`empty-${index}`}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="text-white/20">?</span>
                                </div>
                                <span className="text-white/20">Waiting for player...</span>
                            </div>
                        ))}
                    </div>

                    {/* Add Bot Button (Host only) */}
                    {isHost && canAddBot && (
                        <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                            <p className="text-white/50 text-xs font-semibold tracking-wider mb-3">ADD BOT</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handleAddBot('easy')}
                                    className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2"
                                >
                                    <span>ðŸ¤–</span>
                                    <span>Easy</span>
                                </button>
                                <button
                                    onClick={() => handleAddBot('medium')}
                                    className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2"
                                >
                                    <span>ðŸ¤–</span>
                                    <span>Medium</span>
                                </button>
                                <button
                                    onClick={() => handleAddBot('hard')}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2"
                                >
                                    <span>ðŸ¤–</span>
                                    <span>Hard</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Start Button */}
                {isHost ? (
                    <button
                        onClick={handleStartGame}
                        disabled={!canStart}
                        className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300
                            ${canStart
                                ? 'bg-gradient-to-r from-uno-green to-green-600 text-white hover:shadow-glow-green transform hover:scale-[1.02]'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {canStart ? 'START GAME' : `Waiting for ${2 - lobby.players.length} more player(s)...`}
                    </button>
                ) : (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-white/50">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                            <span>Waiting for host to start...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

