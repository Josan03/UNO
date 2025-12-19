'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { wsSend } from '@/store/websocketMiddleware'
import { PublicPlayerState } from '@shared/protocol'

interface GameResultsProps {
    winnerIndex: number
    winnerName: string
    players: PublicPlayerState[]
    myIndex: number
}

export function GameResults({ winnerIndex, winnerName, players, myIndex }: GameResultsProps) {
    const dispatch = useAppDispatch()
    const isWinner = winnerIndex === myIndex

    const handleReturnToLobby = () => {
        dispatch(wsSend({ type: 'RETURN_TO_LOBBY', payload: {} }))
    }

    // Sort players by card count (winner first with 0 cards)
    const sortedPlayers = [...players]
        .map((p, idx) => ({ ...p, originalIndex: idx }))
        .sort((a, b) => a.cardCount - b.cardCount)

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass rounded-3xl p-8 shadow-2xl w-full max-w-lg animate-slide-up">
                {/* Winner Section */}
                <div className="text-center mb-8">
                    <div className={`text-7xl mb-4 ${isWinner ? 'animate-bounce' : ''}`}>
                        {isWinner ? 'ðŸ†' : 'ðŸŽ®'}
                    </div>
                    <h2 className={`text-4xl font-black mb-2 ${isWinner
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : 'text-white'
                        }`}>
                        {isWinner ? 'VICTORY!' : 'GAME OVER'}
                    </h2>
                    <p className="text-white/60 text-lg">
                        {isWinner
                            ? 'Congratulations! You won the game!'
                            : `${winnerName} wins this round!`}
                    </p>
                </div>

                {/* Results Table */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">ðŸ“Š</span>
                        <h3 className="text-white/70 text-sm font-semibold tracking-wide">FINAL STANDINGS</h3>
                    </div>

                    <div className="space-y-2">
                        {sortedPlayers.map((player, rank) => {
                            const isMe = player.originalIndex === myIndex
                            const isPlayerWinner = player.originalIndex === winnerIndex
                            const position = rank + 1

                            return (
                                <div
                                    key={player.originalIndex}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                                        ${isPlayerWinner
                                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/30'
                                            : isMe
                                                ? 'bg-gradient-to-r from-uno-blue/20 to-blue-600/10 border border-uno-blue/30'
                                                : 'bg-white/5 border border-white/5'
                                        }`}
                                >
                                    {/* Position */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                                        ${position === 1
                                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                                            : position === 2
                                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700'
                                                : position === 3
                                                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                                    : 'bg-white/10 text-white/50'
                                        }`}>
                                        {position === 1 ? 'ðŸ¥‡' : position === 2 ? 'ðŸ¥ˆ' : position === 3 ? 'ðŸ¥‰' : position}
                                    </div>

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold truncate ${isPlayerWinner ? 'text-yellow-400' : isMe ? 'text-uno-blue' : 'text-white'
                                                }`}>
                                                {player.isBot ? 'ðŸ¤– ' : ''}{player.name}
                                            </span>
                                            {isMe && (
                                                <span className="text-uno-blue text-xs">(You)</span>
                                            )}
                                            {isPlayerWinner && (
                                                <span className="text-yellow-400 text-xs">Winner!</span>
                                            )}
                                        </div>
                                        {player.isBot && (
                                            <span className="text-purple-400 text-xs">Bot</span>
                                        )}
                                    </div>

                                    {/* Cards Left */}
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${player.cardCount === 0 ? 'text-uno-green' : 'text-white/70'
                                            }`}>
                                            {player.cardCount}
                                        </div>
                                        <div className="text-white/40 text-xs">
                                            {player.cardCount === 1 ? 'card' : 'cards'}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Return Button */}
                <button
                    onClick={handleReturnToLobby}
                    className="w-full py-4 rounded-xl font-bold text-lg
                        bg-gradient-to-r from-uno-blue to-blue-600 text-white
                        hover:shadow-glow-blue transition-all duration-300 transform hover:scale-[1.02]"
                >
                    RETURN TO LOBBY
                </button>
            </div>
        </div>
    )
}

