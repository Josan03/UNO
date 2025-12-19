import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { setPlayerName } from '../store/gameSlice'
import { wsConnect, wsSend } from '../store/websocketMiddleware'

export function Home() {
    const dispatch = useAppDispatch()
    const { connectionStatus, playerName } = useAppSelector((state) => state.game)
    const [name, setName] = useState(playerName || '')
    const [lobbyCode, setLobbyCode] = useState('')
    const [maxPlayers, setMaxPlayers] = useState(4)

    const handleCreateLobby = () => {
        if (!name.trim()) return

        dispatch(setPlayerName(name.trim()))

        if (connectionStatus !== 'connected') {
            const wsUrl = `ws://${window.location.hostname}:3001`
            dispatch(wsConnect(wsUrl))
        }

        dispatch(wsSend({
            type: 'CREATE_LOBBY',
            payload: { playerName: name.trim(), maxPlayers }
        }))
    }

    const handleJoinLobby = () => {
        if (!name.trim()) return

        dispatch(setPlayerName(name.trim()))

        if (connectionStatus !== 'connected') {
            const wsUrl = `ws://${window.location.hostname}:3001`
            dispatch(wsConnect(wsUrl))
        }

        dispatch(wsSend({
            type: 'JOIN_LOBBY',
            payload: { playerName: name.trim(), lobbyId: lobbyCode.toUpperCase() || undefined }
        }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background cards */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-40 h-56 bg-gradient-to-br from-uno-red to-red-700 
                    rounded-2xl rotate-[-15deg] opacity-20 blur-sm" />
                <div className="absolute top-40 -right-10 w-32 h-44 bg-gradient-to-br from-uno-blue to-blue-700 
                    rounded-2xl rotate-[25deg] opacity-20 blur-sm" />
                <div className="absolute -bottom-10 left-1/4 w-36 h-48 bg-gradient-to-br from-uno-green to-green-700 
                    rounded-2xl rotate-[10deg] opacity-20 blur-sm" />
                <div className="absolute bottom-40 right-1/4 w-28 h-40 bg-gradient-to-br from-uno-yellow to-yellow-600 
                    rounded-2xl rotate-[-20deg] opacity-20 blur-sm" />
            </div>

            <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block relative">
                        <h1 className="text-6xl font-black text-white italic tracking-tight drop-shadow-lg">
                            UNO
                        </h1>
                    </div>
                    <p className="text-white/50 text-sm mt-2 font-medium tracking-wide">MULTIPLAYER</p>
                </div>

                <div className="space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
                            YOUR NAME
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3.5 rounded-xl bg-white/10 text-white 
                                placeholder-white/30 border border-white/10 
                                focus:border-uno-blue/50 focus:bg-white/15 focus:outline-none
                                transition-all duration-200 font-medium"
                        />
                    </div>

                    {/* Player Count */}
                    <div>
                        <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
                            PLAYERS
                        </label>
                        <div className="flex items-center gap-2">
                            {[2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setMaxPlayers(num)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-200
                                        ${maxPlayers === num
                                            ? 'bg-uno-blue text-white shadow-glow-blue'
                                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-white/10'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreateLobby}
                        disabled={!name.trim()}
                        className="w-full py-4 rounded-xl font-bold text-lg tracking-wide
                            bg-gradient-to-r from-uno-red to-red-600 text-white
                            hover:from-red-600 hover:to-red-700 hover:shadow-glow-red
                            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                            transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        CREATE GAME
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <span className="text-white/30 text-sm font-medium">OR JOIN</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>

                    {/* Room Code */}
                    <div>
                        <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
                            ROOM CODE
                        </label>
                        <input
                            type="text"
                            value={lobbyCode}
                            onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            maxLength={8}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/10 text-white text-center
                                placeholder-white/30 border border-white/10 font-mono text-xl tracking-[0.3em]
                                focus:border-uno-blue/50 focus:bg-white/15 focus:outline-none
                                transition-all duration-200 uppercase"
                        />
                    </div>

                    {/* Join Button */}
                    <button
                        onClick={handleJoinLobby}
                        disabled={!name.trim()}
                        className="w-full py-4 rounded-xl font-bold text-lg tracking-wide
                            bg-gradient-to-r from-uno-blue to-blue-600 text-white
                            hover:from-blue-600 hover:to-blue-700 hover:shadow-glow-blue
                            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                            transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        JOIN GAME
                    </button>
                </div>

                {/* Connection Status */}
                <div className="mt-6 text-center">
                    <span className={`inline-flex items-center gap-2 text-sm font-medium ${connectionStatus === 'connected' ? 'text-uno-green' :
                        connectionStatus === 'connecting' ? 'text-uno-yellow' : 'text-white/30'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-uno-green shadow-glow-green' :
                            connectionStatus === 'connecting' ? 'bg-uno-yellow animate-pulse' : 'bg-white/30'
                            }`} />
                        {connectionStatus === 'connected' ? 'Connected' :
                            connectionStatus === 'connecting' ? 'Connecting...' : 'Ready to connect'}
                    </span>
                </div>
            </div>
        </div>
    )
}
