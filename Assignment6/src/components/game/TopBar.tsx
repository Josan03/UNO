'use client'

interface TopBarProps {
    playerCount: number
    isMultiplayer: boolean
    currentPlayerName?: string
    gameOver: boolean
    onExit: () => void
}

export default function TopBar({
    playerCount,
    isMultiplayer,
    currentPlayerName,
    gameOver,
    onExit
}: TopBarProps) {
    return (
        <div className="absolute top-0 flex flex-row gap-4 items-center w-full justify-between p-4 bg-black/20 backdrop-blur-sm">
            <div className="text-white">
                Players: {playerCount} {isMultiplayer && '(Multiplayer)'}
            </div>
            <div className="text-white font-bold">
                {!gameOver && currentPlayerName ? `Turn: ${currentPlayerName}` : 'Game Over'}
            </div>
            <button
                onClick={onExit}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Exit
            </button>
        </div>
    )
}
