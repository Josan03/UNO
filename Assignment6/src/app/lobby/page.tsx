'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Room } from '@/lib/rooms'
import LobbyMenu from '@/components/lobby/LobbyMenu'
import SinglePlayerSetup from '@/components/lobby/SinglePlayerSetup'
import CreateRoom from '@/components/lobby/CreateRoom'
import JoinRoom from '@/components/lobby/JoinRoom'
import WaitingRoom from '@/components/lobby/WaitingRoom'

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

    const handlePlayerNameChange = (index: number, name: string) => {
        const newNames = [...playerNames]
        newNames[index] = name
        setPlayerNames(newNames)
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

    // Menu mode
    if (mode === 'menu') {
        return (
            <LobbyMenu
                onSinglePlayer={() => setMode('singleplayer')}
                onCreateRoom={() => setMode('create')}
                onJoinRoom={() => setMode('join')}
                onBack={() => router.push('/')}
            />
        )
    }

    // Single player mode
    if (mode === 'singleplayer') {
        return (
            <SinglePlayerSetup
                playerCount={playerCount}
                playerNames={playerNames}
                loading={loading}
                onPlayerCountChange={handlePlayerCountChange}
                onPlayerNameChange={handlePlayerNameChange}
                onStart={handleStartSinglePlayer}
                onBack={() => setMode('menu')}
            />
        )
    }

    // Create room mode
    if (mode === 'create') {
        return (
            <CreateRoom
                playerName={playerName}
                maxPlayers={maxPlayers}
                loading={loading}
                error={error}
                onPlayerNameChange={setPlayerName}
                onMaxPlayersChange={setMaxPlayers}
                onCreate={handleCreateRoom}
                onBack={() => {
                    setMode('menu')
                    setError(null)
                }}
            />
        )
    }

    // Join room mode
    if (mode === 'join') {
        return (
            <JoinRoom
                playerName={playerName}
                roomCode={roomCode}
                loading={loading}
                error={error}
                onPlayerNameChange={setPlayerName}
                onRoomCodeChange={setRoomCode}
                onJoin={handleJoinRoom}
                onBack={() => {
                    setMode('menu')
                    setError(null)
                }}
            />
        )
    }

    // Waiting room mode
    if (mode === 'waiting' && room && playerId) {
        return (
            <WaitingRoom
                room={room}
                playerId={playerId}
                loading={loading}
                error={error}
                onToggleReady={handleToggleReady}
                onAddBot={handleAddBot}
                onRemoveBot={handleRemoveBot}
                onStartGame={handleStartGame}
            />
        )
    }

    return null
}
