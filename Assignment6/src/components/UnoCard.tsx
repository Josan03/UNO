'use client'

import { Card } from '@/lib/game/deck'

interface UnoCardProps {
    card?: Card
    back?: boolean
    onClick?: () => void
    className?: string
}

export default function UnoCard({ card, back, onClick, className = '' }: UnoCardProps) {
    return (
        <>
            {/* Back of card */}
            {back && (
                <div
                    onClick={onClick}
                    className={`relative w-24 h-36 rounded-xl border-[6px] border-white shadow-lg overflow-hidden flex items-center justify-center bg-black select-none cursor-pointer ${className}`}
                >
                    <span className="text-white text-3xl font-bold italic tracking-wider">UNO</span>
                </div>
            )}

            {/* Front of card */}
            {!back && card && (
                <div
                    onClick={onClick}
                    className={`relative w-24 h-36 rounded-xl border-[6px] border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold select-none ${card.type !== 'WILD' && card.type !== 'WILD DRAW'
                            ? card.color === 'RED'
                                ? 'bg-red-600'
                                : card.color === 'GREEN'
                                    ? 'bg-green-600'
                                    : card.color === 'BLUE'
                                        ? 'bg-blue-600'
                                        : card.color === 'YELLOW'
                                            ? 'bg-yellow-400'
                                            : 'bg-gray-500'
                            : 'bg-black'
                        } ${onClick ? 'cursor-pointer' : ''} ${className}`}
                >
                    {/* Inner oval */}
                    {card.type !== 'WILD' && card.type !== 'WILD DRAW' && (
                        <div className="absolute inset-0 bg-white rounded-full scale-90 -skew-x-[20deg] z-0"></div>
                    )}

                    {/* Multicolor oval for WILD */}
                    {(card.type === 'WILD' || card.type === 'WILD DRAW') && (
                        <div className="absolute inset-0 rounded-full scale-90 -skew-x-[20deg] z-0 overflow-hidden flex flex-col">
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

                    {/* Numbered cards */}
                    {card.type === 'NUMBERED' && (
                        <>
                            <span
                                className={`relative z-10 text-5xl ${card.color === 'RED'
                                        ? 'text-red-600'
                                        : card.color === 'GREEN'
                                            ? 'text-green-600'
                                            : card.color === 'BLUE'
                                                ? 'text-blue-600'
                                                : card.color === 'YELLOW'
                                                    ? 'text-yellow-600'
                                                    : 'text-gray-600'
                                    }`}
                                style={{
                                    textShadow: '2px 2px 0 white, -2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white'
                                }}
                            >
                                {card.number}
                            </span>
                            <span className="absolute top-1 left-2 text-lg z-10">{card.number}</span>
                            <span className="absolute bottom-1 right-2 text-lg rotate-180 z-10">{card.number}</span>
                        </>
                    )}

                    {/* Action/Wild cards */}
                    {card.type !== 'NUMBERED' && (
                        <>
                            {card.type === 'WILD DRAW' && (
                                <>
                                    <span className="absolute top-1 left-2 text-lg z-10">+4</span>
                                    <span className="absolute bottom-1 right-2 text-lg rotate-180 z-10">+4</span>
                                </>
                            )}
                            <span
                                className={`relative z-10 text-5xl ${card.type !== 'WILD' && card.type !== 'WILD DRAW'
                                        ? card.color === 'RED'
                                            ? 'text-red-600'
                                            : card.color === 'GREEN'
                                                ? 'text-green-600'
                                                : card.color === 'BLUE'
                                                    ? 'text-blue-600'
                                                    : card.color === 'YELLOW'
                                                        ? 'text-yellow-600'
                                                        : 'text-gray-600'
                                        : 'text-white'
                                    }`}
                            >
                                {card.type === 'SKIP' && '⦸'}
                                {card.type === 'REVERSE' && '↺'}
                                {card.type === 'DRAW' && '+2'}
                            </span>
                        </>
                    )}
                </div>
            )}
        </>
    )
}
