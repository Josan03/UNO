import { Card, Color } from '@shared/model/deck'

interface UnoCardProps {
    card: Card
    canPlay?: boolean
    onClick?: () => void
    size?: 'small' | 'medium' | 'large'
    faceDown?: boolean
}

const colorClasses: Record<Color, string> = {
    RED: 'bg-uno-red',
    BLUE: 'bg-uno-blue',
    GREEN: 'bg-uno-green',
    YELLOW: 'bg-uno-yellow'
}

const getCardDisplay = (card: Card): { symbol: string; text: string } => {
    switch (card.type) {
        case 'NUMBERED':
            return { symbol: String(card.number), text: String(card.number) }
        case 'SKIP':
            return { symbol: '⊘', text: 'SKIP' }
        case 'REVERSE':
            return { symbol: '⟲', text: 'REV' }
        case 'DRAW':
            return { symbol: '+2', text: '+2' }
        case 'WILD':
            return { symbol: '🌈', text: 'WILD' }
        case 'WILD DRAW':
            return { symbol: '+4', text: '+4' }
    }
}

const sizeClasses = {
    small: 'w-12 h-18 text-lg',
    medium: 'w-16 h-24 text-2xl',
    large: 'w-20 h-30 text-3xl'
}

export function UnoCard({ card, canPlay, onClick, size = 'medium', faceDown = false }: UnoCardProps) {
    const { symbol, text } = getCardDisplay(card)
    const isWild = card.type === 'WILD' || card.type === 'WILD DRAW'
    const bgColor = isWild ? 'bg-gray-800' : colorClasses[card.color!]

    if (faceDown) {
        return (
            <div
                className={`${sizeClasses[size]} rounded-xl bg-gray-700 border-2 border-gray-600
                    flex items-center justify-center shadow-lg`}
            >
                <span className="text-4xl">🎴</span>
            </div>
        )
    }

    return (
        <div
            onClick={canPlay ? onClick : undefined}
            className={`${sizeClasses[size]} ${bgColor} rounded-xl border-4 border-white
                  flex flex-col items-center justify-center shadow-lg
                  ${canPlay ? 'cursor-pointer hover:scale-110 hover:-translate-y-2 ring-2 ring-white/50' : ''}
                  ${!canPlay && onClick ? 'opacity-60' : ''}
                  transition-all duration-200`}
        >
            {isWild ? (
                <>
                    <span className="text-white font-bold">{symbol}</span>
                    <span className="text-white text-xs mt-1">{text}</span>
                </>
            ) : (
                <span className="text-white font-bold drop-shadow-lg">{symbol}</span>
            )}
        </div>
    )
}
