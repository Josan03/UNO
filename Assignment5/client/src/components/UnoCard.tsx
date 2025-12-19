import { Card, Color } from '@shared/model/deck'

interface UnoCardProps {
    card: Card
    canPlay?: boolean
    onClick?: () => void
    size?: 'small' | 'medium' | 'large'
    faceDown?: boolean
}

// Cyberpunk: Keep bright colors but add glitchy/holographic feel
const colorStyles: Record<Color, { bg: string; text: string; accent: string }> = {
    RED: {
        bg: 'bg-red-500',
        text: 'text-red-500',
        accent: 'border-red-300'
    },
    BLUE: {
        bg: 'bg-cyan-500',
        text: 'text-cyan-500',
        accent: 'border-cyan-300'
    },
    GREEN: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-500',
        accent: 'border-emerald-300'
    },
    YELLOW: {
        bg: 'bg-yellow-400',
        text: 'text-yellow-500',
        accent: 'border-yellow-300'
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
            return { symbol: '✦', small: 'W' }
        case 'WILD DRAW':
            return { symbol: '+4', small: '+4' }
    }
}

const sizeConfig = {
    small: {
        card: 'w-14 h-20',
        symbol: 'text-2xl',
        corner: 'text-[10px]',
    },
    medium: {
        card: 'w-20 h-28',
        symbol: 'text-4xl',
        corner: 'text-xs',
    },
    large: {
        card: 'w-28 h-40',
        symbol: 'text-6xl',
        corner: 'text-sm',
    }
}

export function UnoCard({ card, canPlay, onClick, size = 'medium', faceDown = false }: UnoCardProps) {
    const config = sizeConfig[size]
    const { symbol, small } = getCardContent(card)
    const isWild = card.type === 'WILD' || card.type === 'WILD DRAW'

    if (faceDown) {
        return (
            <div
                className={`${config.card} rounded-lg relative overflow-hidden
                    bg-black border-2 border-purple-500/60`}
            >
                {/* Holographic back */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-cyan-500/20 to-pink-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-purple-400 font-black text-lg tracking-wider">
                        UNO
                    </span>
                </div>
                {/* Scanline */}
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)' }}
                />
            </div>
        )
    }

    const styles = isWild ? null : colorStyles[card.color!]

    return (
        <div
            onClick={canPlay ? onClick : undefined}
            className={`${config.card} rounded-lg relative overflow-hidden
                bg-black
                ${canPlay ? 'cursor-pointer hover:scale-110 hover:-translate-y-3 z-10' : ''}
                ${!canPlay && onClick ? 'opacity-60' : ''}
                transition-all duration-200 ease-out
                border-2 ${isWild ? 'border-purple-500/60' : styles!.accent + '/60'}`}
        >
            {/* Color band - top */}
            <div className={`absolute top-0 left-0 right-0 h-1/4 ${isWild ? 'bg-gradient-to-r from-red-500 via-cyan-500 to-emerald-500' : styles!.bg}`} />

            {/* Color band - bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-1/4 ${isWild ? 'bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500' : styles!.bg}`} />

            {/* Center black area with symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`${config.symbol} font-black 
                    ${isWild ? 'text-white' : styles!.text}
                    drop-shadow-[0_0_10px_currentColor]`}
                >
                    {symbol}
                </span>
            </div>

            {/* Corner indicators */}
            <span className={`absolute top-1 left-1.5 ${config.corner} font-bold 
                ${isWild ? 'text-white' : 'text-black'}`}>
                {small}
            </span>
            <span className={`absolute bottom-1 right-1.5 ${config.corner} font-bold rotate-180
                ${isWild ? 'text-white' : 'text-black'}`}>
                {small}
            </span>

            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 
                pointer-events-none" />

            {/* Scanlines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)' }}
            />

            {/* Playable glow */}
            {canPlay && (
                <div className={`absolute inset-0 rounded-lg border-2 
                    ${isWild ? 'border-purple-400' : styles!.accent} animate-pulse`} />
            )}
        </div>
    )
}
