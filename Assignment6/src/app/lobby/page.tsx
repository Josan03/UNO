'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Room } from '@/lib/rooms'

type LobbyMode = 'menu' | 'create' | 'join' | 'waiting' | 'singleplayer'

export default function Lobby() {
    const [mode, setMode] = useState<LobbyMode>('menu')
    const [playerName, setPlayerName] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [maxPlayers, setMaxPlayers] = useState(4)
    const [loading, setLoading] = useState(false)
    const [room, setRoom] = useState<Room | null>(null)
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [playerCount, setPlayerCount] = useState(2)
    const [playerNames, setPlayerNames] = useState<string[]>(['Player', 'Bot-1'])
    const router = useRouter()

    // Poll for room updates when in waiting room
    useEffect(() => {
        if (mode === 'waiting' && room) {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/room/${room.code}`)
                    if (response.ok) {
                        const data = await response.json()
                        setRoom(data.room)

                        // If game started, redirect to game
                        if (data.room.status === 'playing' && data.room.sessionId) {
                            router.push(`/game/${data.room.sessionId}?roomCode=${data.room.code}&playerId=${playerId}`)
                        }
                    }
                } catch (error) {
                    console.error('Error polling room:', error)
                }
            }, 1000) // Poll every second

            return () => clearInterval(interval)
        }
    }, [mode, room, playerId, router])

    const handleCreateRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostName: playerName, maxPlayers }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create room')
            }

            const data = await response.json()
            setRoom(data.room)
            setPlayerId(data.playerId)
            setMode('waiting')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room')
        } finally {
            setLoading(false)
        }
    }

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return
        }

        if (!roomCode.trim()) {
            setError('Please enter room code')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode, playerName }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to join room')
            }

            const data = await response.json()
            setRoom(data.room)
            setPlayerId(data.playerId)
            setMode('waiting')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleReady = async () => {
        if (!room || !playerId) return

        const player = room.players.find(p => p.id === playerId)
        if (!player) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ready', playerId, ready: !player.ready }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error toggling ready:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddBot = async () => {
        if (!room) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addBot' }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error adding bot:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveBot = async (botId: string) => {
        if (!room) return

        setLoading(true)
        try {
            const response = await fetch(`/api/room/${room.code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeBot', botId }),
            })

            if (response.ok) {
                const data = await response.json()
                setRoom(data.room)
            }
        } catch (err) {
            console.error('Error removing bot:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleStartGame = async () => {
        if (!room) return

        setLoading(true)
        try {
            const response = await fetch('/api/room/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: room.code }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to start game')
            }

            const data = await response.json()
            router.push(`/game/${data.sessionId}?roomCode=${data.room.code}&playerId=${playerId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start game')
            setLoading(false)
        }
    }

    const handlePlayerCountChange = (count: number) => {
        setPlayerCount(count)
        const names: string[] = ['Player']
        for (let i = 1; i < count; i++) {
            names.push(`Bot-${i}`)
        }
        setPlayerNames(names)
    }

    const handleStartSinglePlayer = async () => {
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

    const isHost = room && playerId === room.hostId
    const allReady = room?.players.filter(p => p.type === 'human').every(p => p.ready) || false
    const canStart = room && room.players.length >= 2 && allReady

    // Menu mode
    if (mode === 'menu') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Game Lobby</h1>

                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('singleplayer')}
                            className="w-full py-4 rounded-lg font-bold text-xl bg-yellow-400 text-green-900 hover:bg-yellow-300 shadow-lg transition-all"
                        >
                            Play with Bots
                        </button>

                        <button
                            onClick={() => setMode('create')}
                            className="w-full py-4 rounded-lg font-bold text-xl bg-blue-500 text-white hover:bg-blue-400 shadow-lg transition-all"
                        >
                            Create Multiplayer Room
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="w-full py-4 rounded-lg font-bold text-xl bg-purple-500 text-white hover:bg-purple-400 shadow-lg transition-all"
                        >
                            Join Room
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Single player mode
    if (mode === 'singleplayer') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Game Setup</h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-white text-lg font-semibold mb-3">
                                Number of Players
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[2, 3, 4, 5].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => handlePlayerCountChange(count)}
                                        className={`py-3 rounded-lg font-semibold transition-all ${playerCount === count
                                            ? 'bg-white text-green-900 shadow-lg scale-105'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-white text-lg font-semibold mb-3">Players</label>
                            <div className="space-y-2">
                                {playerNames.map((name, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                const newNames = [...playerNames]
                                                newNames[index] = e.target.value
                                                setPlayerNames(newNames)
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white"
                                            placeholder={`Player ${index + 1}`}
                                            disabled={index > 0}
                                        />
                                        {index === 0 && (
                                            <span className="text-white/70 text-sm font-medium">You</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStartSinglePlayer}
                            disabled={loading}
                            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-yellow-400 text-green-900 hover:bg-yellow-300 shadow-lg'
                                }`}
                        >
                            {loading ? 'Starting...' : 'Start Game'}
                        </button>

                        <button
                            onClick={() => setMode('menu')}
                            className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Create room mode
    if (mode === 'create') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Create Room</h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-white text-lg font-semibold mb-2">Your Name</label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-white text-lg font-semibold mb-2">Max Players</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[2, 3, 4, 5].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setMaxPlayers(count)}
                                        className={`py-3 rounded-lg font-semibold transition-all ${maxPlayers === count
                                            ? 'bg-white text-green-900 shadow-lg scale-105'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCreateRoom}
                            disabled={loading}
                            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg'
                                }`}
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </button>

                        <button
                            onClick={() => {
                                setMode('menu')
                                setError(null)
                            }}
                            className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Join room mode
    if (mode === 'join') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Join Room</h1>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-white text-lg font-semibold mb-2">Your Name</label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-white text-lg font-semibold mb-2">Room Code</label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:border-white font-mono text-xl text-center tracking-widest"
                                placeholder="XXXXXX"
                                maxLength={6}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleJoinRoom}
                            disabled={loading}
                            className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-purple-500 text-white hover:bg-purple-400 shadow-lg'
                                }`}
                        >
                            {loading ? 'Joining...' : 'Join Room'}
                        </button>

                        <button
                            onClick={() => {
                                setMode('menu')
                                setError(null)
                            }}
                            className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Waiting room mode
    if (mode === 'waiting' && room) {
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
                                            onClick={() => handleRemoveBot(player.id)}
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
                            onClick={handleAddBot}
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-500 transition-all mb-4"
                        >
                            Add Bot
                        </button>
                    )}

                    <div className="space-y-3">
                        {playerId && room.players.find(p => p.id === playerId)?.type === 'human' && (
                            <button
                                onClick={handleToggleReady}
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
                                onClick={handleStartGame}
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

    return null
}
