'use client'

interface LobbyMenuProps {
    onSinglePlayer: () => void
    onCreateRoom: () => void
    onJoinRoom: () => void
    onBack: () => void
}

export default function LobbyMenu({ onSinglePlayer, onCreateRoom, onJoinRoom, onBack }: LobbyMenuProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-md w-full">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Game Lobby</h1>

                <div className="space-y-4">
                    <button
                        onClick={onSinglePlayer}
                        className="w-full py-4 rounded-lg font-bold text-xl bg-yellow-400 text-green-900 hover:bg-yellow-300 shadow-lg transition-all"
                    >
                        Play with Bots
                    </button>

                    <button
                        onClick={onCreateRoom}
                        className="w-full py-4 rounded-lg font-bold text-xl bg-blue-500 text-white hover:bg-blue-400 shadow-lg transition-all"
                    >
                        Create Multiplayer Room
                    </button>

                    <button
                        onClick={onJoinRoom}
                        className="w-full py-4 rounded-lg font-bold text-xl bg-purple-500 text-white hover:bg-purple-400 shadow-lg transition-all"
                    >
                        Join Room
                    </button>

                    <button
                        onClick={onBack}
                        className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    )
}
