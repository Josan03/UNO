import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { setPlayerName } from '../store/gameSlice'
import { wsConnect, wsSend } from '../store/websocketMiddleware'

export function Home() {
    const dispatch = useAppDispatch()
    const { connectionStatus, playerName } = useAppSelector((state) => state.game)
    const [name, setName] = useState(playerName || '')
    const [lobbyCode, setLobbyCode] = useState('')

    const handleCreateLobby = () => {
        if (!name.trim()) return

        dispatch(setPlayerName(name.trim()))

        if (connectionStatus !== 'connected') {
            const wsUrl = `ws://${window.location.hostname}:3001`
            dispatch(wsConnect(wsUrl))
        }

        // Message will be queued if not yet connected
        dispatch(wsSend({
            type: 'CREATE_LOBBY',
            payload: { playerName: name.trim() }
        }))
    }

    const handleJoinLobby = () => {
        if (!name.trim()) return

        dispatch(setPlayerName(name.trim()))

        if (connectionStatus !== 'connected') {
            const wsUrl = `ws://${window.location.hostname}:3001`
            dispatch(wsConnect(wsUrl))
        }

        // Message will be queued if not yet connected
        dispatch(wsSend({
            type: 'JOIN_LOBBY',
            payload: { playerName: name.trim(), lobbyId: lobbyCode.toUpperCase() || undefined }
        }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h1 className="text-4xl font-bold text-center text-white mb-2">🎴 UNO</h1>
                <p className="text-center text-white/60 mb-8">Multiplayer</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-white/80 text-sm mb-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/40 
                         border border-white/20 focus:border-white/40 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={handleCreateLobby}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-lg bg-uno-red text-white font-semibold
                       hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
                    >
                        Create New Game
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/40 text-sm">or</span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>

                    <div>
                        <label className="block text-white/80 text-sm mb-1">Room Code</label>
                        <input
                            type="text"
                            value={lobbyCode}
                            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                            placeholder="Enter room code"
                            maxLength={8}
                            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/40 
                         border border-white/20 focus:border-white/40 focus:outline-none uppercase"
                        />
                    </div>

                    <button
                        onClick={handleJoinLobby}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-lg bg-uno-blue text-white font-semibold
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
                    >
                        Join Game
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <span className={`inline-flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-green-400' :
                        connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-white/40'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' :
                            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-white/40'
                            }`} />
                        {connectionStatus === 'connected' ? 'Connected' :
                            connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </span>
                </div>
            </div>
        </div>
    )
}
