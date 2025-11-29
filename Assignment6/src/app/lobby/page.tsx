'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LobbyMenu from '@/components/lobby/LobbyMenu'
import SinglePlayerSetup from '@/components/lobby/SinglePlayerSetup'
import CreateRoom from '@/components/lobby/CreateRoom'
import JoinRoom from '@/components/lobby/JoinRoom'
import WaitingRoom from '@/components/lobby/WaitingRoom'
import { useRoomManagement } from '@/hooks/useRoomManagement'
import { useSinglePlayerGame } from '@/hooks/useSinglePlayerGame'
import { useRoomPolling } from '@/hooks/useRoomPolling'

type LobbyMode = 'menu' | 'create' | 'join' | 'waiting' | 'singleplayer'

export default function Lobby() {
    const [mode, setMode] = useState<LobbyMode>('menu')
    const [playerName, setPlayerName] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [maxPlayers, setMaxPlayers] = useState(4)
    const router = useRouter()

    const {
        loading: roomLoading,
        room,
        playerId,
        error: roomError,
        setRoom,
        setError: setRoomError,
        createRoom,
        joinRoom,
        toggleReady,
        addBot,
        removeBot,
        startGame
    } = useRoomManagement()

    const {
        loading: gameLoading,
        playerCount,
        playerNames,
        handlePlayerCountChange,
        handlePlayerNameChange,
        startGame: startSinglePlayer
    } = useSinglePlayerGame()

    useRoomPolling(mode, room, playerId, setRoom)

    const handleCreateRoom = async () => {
        const success = await createRoom(playerName, maxPlayers)
        if (success) setMode('waiting')
    }

    const handleJoinRoom = async () => {
        const success = await joinRoom(playerName, roomCode)
        if (success) setMode('waiting')
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
                loading={gameLoading}
                onPlayerCountChange={handlePlayerCountChange}
                onPlayerNameChange={handlePlayerNameChange}
                onStart={startSinglePlayer}
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
                loading={roomLoading}
                error={roomError}
                onPlayerNameChange={setPlayerName}
                onMaxPlayersChange={setMaxPlayers}
                onCreate={handleCreateRoom}
                onBack={() => {
                    setMode('menu')
                    setRoomError(null)
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
                loading={roomLoading}
                error={roomError}
                onPlayerNameChange={setPlayerName}
                onRoomCodeChange={setRoomCode}
                onJoin={handleJoinRoom}
                onBack={() => {
                    setMode('menu')
                    setRoomError(null)
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
                loading={roomLoading}
                error={roomError}
                onToggleReady={toggleReady}
                onAddBot={addBot}
                onRemoveBot={removeBot}
                onStartGame={startGame}
            />
        )
    }

    return null
}
