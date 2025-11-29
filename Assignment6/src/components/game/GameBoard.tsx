'use client'

import { Card, Color } from '@/lib/game/deck'
import BotHand from '@/components/BotHand'
import DiscardPile from '@/components/DiscardPile'
import PlayerHand from '@/components/PlayerHand'

interface GameBoardProps {
    playerCount: number
    players: string[]
    hands: Card[][]
    playerInTurn: number | undefined
    myPlayerIndex: number
    opponentIndices: number[]
    discardPile: Card[]
    currentColor: Color
    drawPileCount: number
    onPlayCard: (cardIndex: number, namedColor?: Color) => void
    onDrawCard: () => void
}

export default function GameBoard({
    playerCount,
    players,
    hands,
    playerInTurn,
    myPlayerIndex,
    opponentIndices,
    discardPile,
    currentColor,
    drawPileCount,
    onPlayCard,
    onDrawCard
}: GameBoardProps) {
    return (
        <>
            {/* Top opponent(s) */}
            {(playerCount === 2 || playerCount === 4) && opponentIndices[playerCount === 2 ? 0 : 1] !== undefined && (
                <div className="flex flex-col w-full items-center gap-4">
                    <BotHand
                        name={players[opponentIndices[playerCount === 2 ? 0 : 1]]}
                        index={opponentIndices[playerCount === 2 ? 0 : 1]}
                        isActive={playerInTurn === opponentIndices[playerCount === 2 ? 0 : 1]}
                        cards={hands[opponentIndices[playerCount === 2 ? 0 : 1]]}
                        orientation="horizontal"
                    />
                </div>
            )}

            {/* Middle row with side opponents and center pile */}
            <div className="flex flex-row w-full justify-between items-center">
                {/* Left opponent */}
                {(playerCount === 3 || playerCount === 4) && opponentIndices[0] !== undefined && (
                    <BotHand
                        name={players[opponentIndices[0]]}
                        index={opponentIndices[0]}
                        isActive={playerInTurn === opponentIndices[0]}
                        cards={hands[opponentIndices[0]]}
                        orientation="vertical"
                    />
                )}

                {/* Center: Discard pile and draw pile */}
                <div className="flex-1 flex justify-center">
                    <DiscardPile
                        topCard={discardPile[0]}
                        currentColor={currentColor}
                        drawPileCount={drawPileCount}
                        onDrawCard={onDrawCard}
                    />
                </div>

                {/* Right opponent */}
                {(playerCount === 3 || playerCount === 4) && opponentIndices[playerCount === 3 ? 1 : 2] !== undefined && (
                    <BotHand
                        name={players[opponentIndices[playerCount === 3 ? 1 : 2]]}
                        index={opponentIndices[playerCount === 3 ? 1 : 2]}
                        isActive={playerInTurn === opponentIndices[playerCount === 3 ? 1 : 2]}
                        cards={hands[opponentIndices[playerCount === 3 ? 1 : 2]]}
                        orientation="vertical"
                    />
                )}
            </div>

            {/* Bottom: Player hand */}
            <PlayerHand
                name={players[myPlayerIndex]}
                index={myPlayerIndex}
                isActive={playerInTurn === myPlayerIndex}
                cards={hands[myPlayerIndex]}
                onPlay={onPlayCard}
            />
        </>
    )
}
