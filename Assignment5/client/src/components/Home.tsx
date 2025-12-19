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
                                            ? 'bg-purple-600 text-white border-2 border-purple-400'
                                            : 'bg-white/10 text-white/60 hover:bg-purple-500/20 hover:text-white border border-white/10'
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
                            bg-gradient-to-r from-cyan-500 to-teal-500 text-white
                            hover:from-cyan-400 hover:to-teal-400
                            disabled:opacity-40 disabled:cursor-not-allowed
                            transition-all duration-300 transform hover:scale-[1.02]
                            border border-cyan-400/30"
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
                            bg-gradient-to-r from-purple-600 to-violet-600 text-white
                            hover:from-purple-500 hover:to-violet-500
                            disabled:opacity-40 disabled:cursor-not-allowed
                            transition-all duration-300 transform hover:scale-[1.02]
                            border border-purple-400/30"
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
