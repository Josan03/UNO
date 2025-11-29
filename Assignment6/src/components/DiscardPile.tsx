'use client'

import { Card, Color } from '@/lib/game/deck'
import UnoCard from './UnoCard'

interface DiscardPileProps {
    topCard: Card
    currentColor: Color
    drawPileCount: number
    onDrawCard: () => void
}

export default function DiscardPile({ topCard, currentColor, drawPileCount, onDrawCard }: DiscardPileProps) {
    const colorClass =
        currentColor === 'RED'
            ? 'bg-red-600'
            : currentColor === 'GREEN'
                ? 'bg-green-600'
                : currentColor === 'BLUE'
                    ? 'bg-blue-600'
                    : currentColor === 'YELLOW'
                        ? 'bg-yellow-400'
                        : 'bg-gray-500'

    return (
        <div className="flex flex-row gap-2">
            <div className="flex flex-row gap-1 border-4 rounded-2xl p-2 w-fit border-white/30">
                <UnoCard back onClick={onDrawCard} className="hover:scale-105 transition-transform" />
                <UnoCard card={topCard} />
            </div>
            <div className="flex flex-col justify-between items-center">
                <div className={`w-16 h-16 rounded-lg ${colorClass} border-4 border-white shadow-lg`}></div>
                <div className="text-white text-sm mt-2">
                    <p>Draw: {drawPileCount}</p>
                </div>
            </div>
        </div>
    )
}
