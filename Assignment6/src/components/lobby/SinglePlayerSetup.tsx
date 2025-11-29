'use client'

interface SinglePlayerSetupProps {
    playerCount: number
    playerNames: string[]
    loading: boolean
    onPlayerCountChange: (count: number) => void
    onPlayerNameChange: (index: number, name: string) => void
    onStart: () => void
    onBack: () => void
}

export default function SinglePlayerSetup({
    playerCount,
    playerNames,
    loading,
    onPlayerCountChange,
    onPlayerNameChange,
    onStart,
    onBack
}: SinglePlayerSetupProps) {
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
                                    onClick={() => onPlayerCountChange(count)}
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
                                        onChange={(e) => onPlayerNameChange(index, e.target.value)}
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
                        onClick={onStart}
                        disabled={loading}
                        className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-yellow-400 text-green-900 hover:bg-yellow-300 shadow-lg'
                            }`}
                    >
                        {loading ? 'Starting...' : 'Start Game'}
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
