import { useAppDispatch, useAppSelector } from '../store'
import { wsSend } from '../store/websocketMiddleware'

export function Lobby() {
    const dispatch = useAppDispatch()
    const { lobby, playerName, error } = useAppSelector((state) => state.game)

    if (!lobby) return null

    const isHost = lobby.players[lobby.hostIndex] === playerName
    const canStart = lobby.players.length >= 2

    const handleStartGame = () => {
        dispatch(wsSend({ type: 'START_GAME', payload: {} }))
    }

    const copyLobbyCode = () => {
        navigator.clipboard.writeText(lobby.lobbyId)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Game Lobby</h2>

                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-white/60">Code:</span>
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">
                        {lobby.lobbyId}
                    </span>
                    <button
                        onClick={copyLobbyCode}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy code"
                    >
                        📋
                    </button>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="text-white/60 text-sm mb-2">
                        Players ({lobby.players.length}/10)
                    </div>

                    <div className="space-y-2">
                        {lobby.players.map((player, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-lg ${player === playerName ? 'bg-uno-blue/30' : 'bg-white/5'
                                    }`}
                            >
                                <span className="text-2xl">
                                    {index === lobby.hostIndex ? '👑' : '👤'}
                                </span>
                                <span className="text-white font-medium flex-1">
                                    {player}
                                    {player === playerName && (
                                        <span className="text-white/40 text-sm ml-2">(You)</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {isHost ? (
                    <button
                        onClick={handleStartGame}
                        disabled={!canStart}
                        className="w-full py-3 rounded-lg bg-uno-green text-white font-semibold
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
                    >
                        {canStart ? 'Start Game' : 'Waiting for players...'}
                    </button>
                ) : (
                    <div className="text-center text-white/60 py-3">
                        Waiting for host to start the game...
                    </div>
                )}
            </div>
        </div>
    )
}
