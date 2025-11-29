'use client'

import { Room } from '@/lib/rooms'

interface WaitingRoomProps {
    room: Room
    playerId: string
    loading: boolean
    error: string | null
    onToggleReady: () => void
    onAddBot: () => void
    onRemoveBot: (botId: string) => void
    onStartGame: () => void
}

export default function WaitingRoom({
    room,
    playerId,
    loading,
    error,
    onToggleReady,
    onAddBot,
    onRemoveBot,
    onStartGame
}: WaitingRoomProps) {
    const isHost = playerId === room.hostId
    const allReady = room.players.filter(p => p.type === 'human').every(p => p.ready) || false
    const canStart = room.players.length >= 2 && allReady

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-2xl w-full">
                <h1 className="text-4xl font-bold text-white text-center mb-4">Waiting Room</h1>

                <div className="bg-black/20 rounded-lg p-4 mb-6 text-center">
                    <div className="text-white/70 text-sm mb-1">Room Code</div>
                    <div className="text-white text-4xl font-bold font-mono tracking-widest">{room.code}</div>
                    <div className="text-white/70 text-sm mt-2">Share this code with friends!</div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="text-white text-lg font-semibold">
                        Players ({room.players.length}/{room.maxPlayers})
                    </div>
                    {room.players.map((player) => (
                        <div
                            key={player.id}
                            className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-white font-semibold">{player.name}</div>
                                {player.type === 'bot' && (
                                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">BOT</span>
                                )}
                                {player.id === room.hostId && (
                                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">HOST</span>
                                )}
                                {player.id === playerId && (
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">YOU</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {player.type === 'human' && (
                                    <div className={`px-3 py-1 rounded font-semibold ${player.ready
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-500 text-white'
                                        }`}>
                                        {player.ready ? 'Ready' : 'Not Ready'}
                                    </div>
                                )}
                                {isHost && player.type === 'bot' && (
                                    <button
                                        onClick={() => onRemoveBot(player.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isHost && room.players.length < room.maxPlayers && (
                    <button
                        onClick={onAddBot}
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-500 transition-all mb-4"
                    >
                        Add Bot
                    </button>
                )}

                <div className="space-y-3">
                    {room.players.find(p => p.id === playerId)?.type === 'human' && (
                        <button
                            onClick={onToggleReady}
                            disabled={loading}
                            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${room.players.find(p => p.id === playerId)?.ready
                                    ? 'bg-gray-500 text-white hover:bg-gray-400'
                                    : 'bg-green-500 text-white hover:bg-green-400'
                                } shadow-lg`}
                        >
                            {room.players.find(p => p.id === playerId)?.ready ? 'Not Ready' : 'Ready Up'}
                        </button>
                    )}

                    {isHost && (
                        <button
                            onClick={onStartGame}
                            disabled={!canStart || loading}
                            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${canStart && !loading
                                    ? 'bg-yellow-400 text-green-900 hover:bg-yellow-300 shadow-lg'
                                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                }`}
                        >
                            {loading ? 'Starting...' : 'Start Game'}
                        </button>
                    )}

                    {!isHost && !allReady && (
                        <div className="text-white/70 text-center text-sm">
                            Waiting for all players to be ready...
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
