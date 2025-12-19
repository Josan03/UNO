import { Card, Color } from '@shared/model/deck'

interface UnoCardProps {
    card: Card
    canPlay?: boolean
    onClick?: () => void
    size?: 'small' | 'medium' | 'large'
    faceDown?: boolean
}

const colorStyles: Record<Color, { bg: string; text: string; glow: string }> = {
    RED: {
        bg: 'bg-gradient-to-br from-red-500 via-uno-red to-red-700',
        text: 'text-uno-red',
        glow: 'shadow-glow-red'
    },
    BLUE: {
        bg: 'bg-gradient-to-br from-blue-400 via-uno-blue to-blue-700',
        text: 'text-uno-blue',
        glow: 'shadow-glow-blue'
    },
    GREEN: {
        bg: 'bg-gradient-to-br from-green-400 via-uno-green to-green-700',
        text: 'text-uno-green',
        glow: 'shadow-glow-green'
    },
    YELLOW: {
        bg: 'bg-gradient-to-br from-yellow-300 via-uno-yellow to-yellow-500',
        text: 'text-yellow-600',
        glow: 'shadow-glow-yellow'
    }
}

const getCardContent = (card: Card): { symbol: string; small: string } => {
    switch (card.type) {
        case 'NUMBERED':
            return { symbol: String(card.number), small: String(card.number) }
        case 'SKIP':
            return { symbol: '⊘', small: '⊘' }
        case 'REVERSE':
            return { symbol: '⇄', small: '⇄' }
        case 'DRAW':
            return { symbol: '+2', small: '+2' }
        case 'WILD':
            return { symbol: '★', small: 'W' }
        case 'WILD DRAW':
            return { symbol: '+4', small: '+4' }
    }
}

const sizeConfig = {
    small: {
        card: 'w-14 h-20',
        symbol: 'text-xl',
        corner: 'text-[10px]',
        ellipse: 'inset-[15%]'
    },
    medium: {
        card: 'w-20 h-28',
        symbol: 'text-3xl',
        corner: 'text-xs',
        ellipse: 'inset-[12%]'
    },
    large: {
        card: 'w-28 h-40',
        symbol: 'text-5xl',
        corner: 'text-sm',
        ellipse: 'inset-[10%]'
    }
}

export function UnoCard({ card, canPlay, onClick, size = 'medium', faceDown = false }: UnoCardProps) {
    const config = sizeConfig[size]
    const { symbol, small } = getCardContent(card)
    const isWild = card.type === 'WILD' || card.type === 'WILD DRAW'

    if (faceDown) {
        return (
            <div
                className={`${config.card} rounded-xl relative overflow-hidden shadow-card
                    bg-gradient-to-br from-gray-800 via-gray-900 to-black
                    border-2 border-gray-600`}
            >
                {/* Card back pattern */}
                <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-red-600 to-red-800 
                    flex items-center justify-center">
                    <div className="absolute inset-2 rounded-md border-2 border-yellow-400/50" />
                    <span className="text-yellow-400 font-black italic text-lg tracking-tighter 
                        drop-shadow-lg rotate-[-5deg]">
                        UNO
                    </span>
                </div>
            </div>
        )
    }

    const styles = isWild ? null : colorStyles[card.color!]
    const bgClass = isWild
        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
        : styles!.bg

    return (
        <div
            onClick={canPlay ? onClick : undefined}
            className={`${config.card} rounded-xl relative overflow-hidden shadow-card
                ${bgClass}
                ${canPlay ? `cursor-pointer hover:scale-110 hover:-translate-y-3 hover:shadow-card-hover 
                    ${isWild ? '' : styles!.glow} z-10` : ''}
                ${!canPlay && onClick ? 'opacity-70 grayscale-[20%]' : ''}
                transition-all duration-200 ease-out
                border-2 ${isWild ? 'border-gray-600' : 'border-white/30'}`}
        >
            {/* White ellipse center */}
            <div className={`absolute ${config.ellipse} bg-white rounded-[45%] rotate-[30deg]
                shadow-inner flex items-center justify-center overflow-hidden`}>
                {isWild ? (
                    <div className="w-full h-full relative overflow-hidden rounded-[45%]">
                        {/* Wild card multi-color segments - no counter-rotation needed since we clip */}
                        <div className="absolute inset-0">
                            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-uno-red" />
                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-uno-blue" />
                            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-uno-yellow" />
                            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-uno-green" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`${config.symbol} font-black text-white drop-shadow-lg rotate-[-30deg]`}>
                                {symbol}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className={`${config.symbol} font-black ${styles!.text} rotate-[-30deg]`}>
                        {symbol}
                    </span>
                )}
            </div>

            {/* Corner numbers/symbols */}
            {!isWild && (
                <>
                    <span className={`absolute top-1.5 left-2 ${config.corner} font-bold text-white 
                        drop-shadow-md`}>
                        {small}
                    </span>
                    <span className={`absolute bottom-1.5 right-2 ${config.corner} font-bold text-white 
                        drop-shadow-md rotate-180`}>
                        {small}
                    </span>
                </>
            )}

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent 
                pointer-events-none rounded-xl" />

            {/* Playable indicator */}
            {canPlay && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-white/60 ring-offset-1 
                    ring-offset-transparent animate-pulse" />
            )}
        </div>
    )
}
