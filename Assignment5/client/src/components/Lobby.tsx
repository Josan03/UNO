import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { wsSend } from '../store/websocketMiddleware'

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
            <div className="bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 w-full max-w-lg animate-slide-up">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-purple-300 mb-1 tracking-wider">GAME LOBBY</h2>
                    <p className="text-purple-400/60 text-sm font-mono">Waiting for players...</p>
                </div>

                {/* Room Code */}
                <div className="mb-8">
                    <div className="bg-black/40 border border-purple-500/20 rounded-xl p-6 text-center">
                        <p className="text-purple-400/60 text-xs font-semibold tracking-wider mb-2 font-mono">ROOM CODE</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-black text-purple-300 tracking-[0.2em] font-mono">
                                {lobby.lobbyId}
                            </span>
                            <button
                                onClick={copyLobbyCode}
                                className={`p-2.5 rounded-lg transition-all duration-200 ${copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20'
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
                        <p className="text-purple-500/40 text-xs mt-2 font-mono">Share this code with friends</p>
                    </div>
                </div>

                {/* Players List */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-300/70 text-sm font-semibold tracking-wider">PLAYERS</span>
                        <span className="text-purple-400/50 text-sm font-mono">
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
                                        ? 'bg-purple-500/20 border border-purple-400/40'
                                        : isBotPlayer
                                            ? 'bg-violet-500/10 border border-violet-500/30'
                                            : 'bg-black/30 border border-purple-500/20'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border
                                        ${isHostPlayer
                                            ? 'bg-yellow-500/20 border-yellow-400/50'
                                            : isBotPlayer
                                                ? 'bg-violet-500/20 border-violet-400/50'
                                                : 'bg-purple-500/10 border-purple-400/30'}`}>
                                        {isHostPlayer ? (
                                            <span className="text-lg">👑</span>
                                        ) : isBotPlayer ? (
                                            <span className="text-lg">🤖</span>
                                        ) : (
                                            <span className="text-purple-300 font-bold">{player.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-white font-semibold">{player}</span>
                                        {isMe && (
                                            <span className="text-purple-400 text-xs ml-2">(You)</span>
                                        )}
                                        {isHostPlayer && !isBotPlayer && (
                                            <span className="text-yellow-400 text-xs ml-2">Host</span>
                                        )}
                                        {isBotPlayer && (
                                            <span className="text-violet-400 text-xs ml-2">Bot</span>
                                        )}
                                    </div>
                                    {isBotPlayer && isHost && (
                                        <button
                                            onClick={() => handleRemoveBot(index)}
                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/20"
                                            title="Remove bot"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <div className={`w-3 h-3 rounded-full ${isMe ? 'bg-purple-400' : isBotPlayer ? 'bg-violet-400' : 'bg-purple-500/60'
                                        }`} />
                                </div>
                            )
                        })}

                        {/* Empty slots */}
                        {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, index) => (
                            <div
                                key={`empty-${index}`}
                                className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-dashed border-purple-500/20"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <span className="text-purple-400/30">?</span>
                                </div>
                                <span className="text-purple-300/30">Waiting for player...</span>
                            </div>
                        ))}
                    </div>

                    {/* Add Bot Button (Host only) */}
                    {isHost && canAddBot && (
                        <div className="mt-4 p-4 rounded-xl bg-black/30 border border-purple-500/20">
                            <p className="text-purple-300/50 text-xs font-semibold tracking-wider mb-3">ADD BOT</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handleAddBot('easy')}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2 border border-emerald-500/30"
                                >
                                    <span>🤖</span>
                                    <span>Easy</span>
                                </button>
                                <button
                                    onClick={() => handleAddBot('medium')}
                                    className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2 border border-amber-500/30"
                                >
                                    <span>🤖</span>
                                    <span>Medium</span>
                                </button>
                                <button
                                    onClick={() => handleAddBot('hard')}
                                    className="px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 
                                        transition-all duration-200 text-sm font-medium flex items-center gap-2 border border-rose-500/30"
                                >
                                    <span>🤖</span>
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
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/50 transform hover:scale-[1.02]'
                                : 'bg-black/30 text-purple-300/30 cursor-not-allowed border border-purple-500/20'
                            }`}
                    >
                        {canStart ? 'START GAME' : `Waiting for ${2 - lobby.players.length} more player(s)...`}
                    </button>
                ) : (
                    <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-purple-300/50">
                            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-400/70 rounded-full animate-spin" />
                            <span>Waiting for host to start...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
