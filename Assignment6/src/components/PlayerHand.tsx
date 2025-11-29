'use client'

import { Card, Color } from '@/lib/game/deck'
import UnoCard from './UnoCard'
import { useState } from 'react'

interface PlayerHandProps {
    name: string
    index: number
    isActive: boolean
    cards: Card[]
    onPlay: (cardIndex: number, namedColor?: Color) => void
}

export default function PlayerHand({ name, index, isActive, cards, onPlay }: PlayerHandProps) {
    const [wildChoice, setWildChoice] = useState<number | null>(null)

    const handleClick = (card: Card, idx: number) => {
        if (!card || !isActive) return

        if (card.type === 'WILD' || card.type === 'WILD DRAW') {
            setWildChoice(idx)
        } else {
            onPlay(idx)
        }
    }

    const chooseColor = (color: Color) => {
        if (wildChoice !== null) {
            onPlay(wildChoice, color)
            setWildChoice(null)
        }
    }

    return (
        <div
            className={`flex flex-col w-fit gap-2 px-10 py-4 rounded-lg transition-all ${!isActive ? 'opacity-50' : ''
                }`}
        >
            <p className="text-center text-3xl font-bold text-white">{name}</p>

            <div className="flex flex-row gap-1">
                {cards.map((card, idx) => (
                    <div key={idx} className="-ml-5" onClick={() => handleClick(card, idx)}>
                        <UnoCard
                            card={card}
                            className={`transition-transform ${isActive ? 'hover:scale-105 hover:-translate-y-2' : ''}`}
                        />
                    </div>
                ))}
            </div>

            {/* Wild card color picker */}
            {wildChoice !== null && (
                <div className="flex gap-2 mt-2 justify-center">
                    <button
                        className="w-12 h-12 transition-transform hover:scale-110 rounded bg-red-600"
                        onClick={() => chooseColor('RED')}
                    ></button>
                    <button
                        className="w-12 h-12 transition-transform hover:scale-110 rounded bg-yellow-400"
                        onClick={() => chooseColor('YELLOW')}
                    ></button>
                    <button
                        className="w-12 h-12 transition-transform hover:scale-110 rounded bg-green-600"
                        onClick={() => chooseColor('GREEN')}
                    ></button>
                    <button
                        className="w-12 h-12 transition-transform hover:scale-110 rounded bg-blue-600"
                        onClick={() => chooseColor('BLUE')}
                    ></button>
                </div>
            )}
        </div>
    )
}
