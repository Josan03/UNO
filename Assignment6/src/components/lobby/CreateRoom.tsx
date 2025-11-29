'use client'

interface CreateRoomProps {
    playerName: string
    maxPlayers: number
    loading: boolean
    error: string | null
    onPlayerNameChange: (name: string) => void
    onMaxPlayersChange: (count: number) => void
    onCreate: () => void
    onBack: () => void
}

export default function CreateRoom({
    playerName,
    maxPlayers,
    loading,
    error,
    onPlayerNameChange,
    onMaxPlayersChange,
    onCreate,
    onBack
}: CreateRoomProps) {
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
                            onChange={(e) => onPlayerNameChange(e.target.value)}
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
                                    onClick={() => onMaxPlayersChange(count)}
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
                        onClick={onCreate}
                        disabled={loading}
                        className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg'
                            }`}
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </button>

                    <button
                        onClick={onBack}
                        className="w-full py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    )
}
