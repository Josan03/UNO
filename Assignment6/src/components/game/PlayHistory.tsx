'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { PlayHistoryEntry } from '@/store/slices/gameSlice'
import { Card } from '@/lib/game/deck'

interface PlayHistoryProps {
    history: PlayHistoryEntry[]
}

function MiniCard({ card }: { card: Card }) {
    const isWild = card.type === 'WILD' || card.type === 'WILD DRAW'
    const bgColor = isWild
        ? 'bg-black'
        : card.color === 'RED'
            ? 'bg-red-600'
            : card.color === 'GREEN'
                ? 'bg-green-600'
                : card.color === 'BLUE'
                    ? 'bg-blue-600'
                    : card.color === 'YELLOW'
                        ? 'bg-yellow-400'
                        : 'bg-gray-500'

    const textColor = isWild || card.color !== 'YELLOW' ? 'text-white' : 'text-yellow-900'

    return (
        <div className={`relative w-6 h-9 rounded border border-white ${bgColor} flex items-center justify-center shadow-sm`}>
            {isWild && (
                <div className="absolute inset-0 rounded overflow-hidden flex flex-col opacity-60">
                    <div className="flex-1 flex">
                        <div className="flex-1 bg-red-600"></div>
                        <div className="flex-1 bg-yellow-400"></div>
                    </div>
                    <div className="flex-1 flex">
                        <div className="flex-1 bg-green-600"></div>
                        <div className="flex-1 bg-blue-600"></div>
                    </div>
                </div>
            )}
            <span className={`relative z-10 text-[10px] font-bold ${textColor}`}>
                {card.type === 'NUMBERED' && card.number}
                {card.type === 'SKIP' && '⦸'}
                {card.type === 'REVERSE' && '↺'}
                {card.type === 'DRAW' && '+2'}
                {card.type === 'WILD' && 'W'}
                {card.type === 'WILD DRAW' && '+4'}
            </span>
        </div>
    )
}

export default function PlayHistory({ history }: PlayHistoryProps) {
    // Show last 5 plays
    const recentPlays = history.slice(0, 5)

    if (recentPlays.length === 0) return null

    return (
        <div className="absolute top-24 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-3 min-w-[140px]">
            <h3 className="text-white text-xs font-bold mb-2">Recent Plays</h3>
            <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                    {recentPlays.map((entry, idx) => (
                        <motion.div
                            key={`${entry.playerName}-${entry.card.type}-${entry.card.color}-${entry.card.number}-${idx}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2 bg-white/10 rounded px-2 py-1"
                        >
                            <MiniCard card={entry.card} />
                            <span className="text-white text-xs font-medium truncate">
                                {entry.playerName}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
