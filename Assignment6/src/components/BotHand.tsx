'use client'

import { Card } from '@/lib/game/deck'
import UnoCard from './UnoCard'

interface BotHandProps {
    name: string
    index: number
    isActive: boolean
    cards: Card[]
    orientation?: 'horizontal' | 'vertical'
    className?: string
}

export default function BotHand({
    name,
    index,
    isActive,
    cards,
    orientation = 'horizontal',
    className = ''
}: BotHandProps) {
    return (
        <div
            className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} gap-2 items-center ${!isActive ? 'opacity-50' : ''
                } ${className}`}
        >
            <p
                className={`text-2xl font-bold text-white ${orientation === 'vertical' ? 'writing-mode-vertical' : ''}`}
            >
                {name}
            </p>
            <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} gap-1`}>
                {cards.map((_, idx) => (
                    <div key={idx} className={orientation === 'vertical' ? 'mt-[-20px]' : 'ml-[-20px]'}>
                        <UnoCard back />
                    </div>
                ))}
            </div>
            <span className="text-white text-sm">({cards.length} cards)</span>
        </div>
    )
}
