import { useAppSelector } from '../store'
import { HistoryEntry } from '../store/gameSlice'
import { Color } from '@shared/model/deck'

function getCardDisplay(entry: HistoryEntry): string {
    if (!entry.card) return ''
    const card = entry.card

    switch (card.type) {
        case 'NUMBERED':
            return `${card.number}`
        case 'SKIP':
            return 'Skip'
        case 'REVERSE':
            return 'Reverse'
        case 'DRAW':
            return '+2'
        case 'WILD':
            return 'Wild'
        case 'WILD DRAW':
            return '+4'
        default:
            return 'Card'
    }
}

function getColorDot(color?: Color): string {
    switch (color) {
        case 'RED': return 'bg-uno-red'
        case 'BLUE': return 'bg-uno-blue'
        case 'GREEN': return 'bg-uno-green'
        case 'YELLOW': return 'bg-uno-yellow'
        default: return 'bg-gray-500'
    }
}

function getEntryIcon(type: string): string {
    switch (type) {
        case 'CARD_PLAYED': return '🎴'
        case 'CARD_DRAWN': return '📥'
        case 'UNO_CALLED': return '🔔'
        case 'UNO_CAUGHT': return '🚨'
        default: return '•'
    }
}

export function GameHistory() {
    const { gameHistory, game } = useAppSelector((state) => state.game)

    if (!game) return null

    const recentHistory = [...gameHistory].reverse().slice(0, 5)

    return (
        <div className="glass-dark rounded-2xl p-4 w-72">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📜</span>
                <h3 className="text-white/70 text-sm font-semibold tracking-wide">GAME LOG</h3>
            </div>

            {recentHistory.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">No moves yet</p>
            ) : (
                <div className="space-y-2">
                    {recentHistory.map((entry, index) => {
                        const isMyAction = entry.playerIndex === game.playerIndex
                        const isLatest = index === 0
                        const cardColor = entry.card?.type === 'WILD' || entry.card?.type === 'WILD DRAW'
                            ? entry.newColor
                            : (entry.card as any)?.color

                        return (
                            <div
                                key={entry.id}
                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${isMyAction
                                        ? 'bg-uno-blue/20 border border-uno-blue/30'
                                        : 'bg-white/5'
                                    } ${isLatest ? 'opacity-100 scale-100' : 'opacity-60 scale-[0.98]'}`}
                            >
                                <span className="text-lg">{getEntryIcon(entry.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-sm truncate ${isMyAction ? 'text-uno-blue' : 'text-white/80'
                                            }`}>
                                            {isMyAction ? 'You' : entry.playerName}
                                        </span>
                                        {entry.type === 'CARD_PLAYED' && cardColor && (
                                            <span className={`w-2.5 h-2.5 rounded-full ${getColorDot(cardColor)}`} />
                                        )}
                                    </div>
                                    <p className="text-white/50 text-xs truncate">
                                        {entry.type === 'CARD_PLAYED' && `Played ${getCardDisplay(entry)}`}
                                        {entry.type === 'CARD_DRAWN' && 'Drew a card'}
                                        {entry.type === 'UNO_CALLED' && 'Called UNO!'}
                                        {entry.type === 'UNO_CAUGHT' && `Caught ${entry.accusedName}!`}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
