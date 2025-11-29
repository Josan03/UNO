'use client'

import { motion, AnimatePresence } from 'framer-motion'

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
            <div className="text-white font-bold text-xl min-w-[200px] flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameOver ? 'game-over' : currentPlayerName || 'waiting'}
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{
                            duration: 0.4,
                            ease: 'easeInOut',
                            scale: { type: 'spring', stiffness: 300, damping: 20 }
                        }}
                        className="inline-block"
                    >
                        {!gameOver && currentPlayerName ? `Turn: ${currentPlayerName}` : 'Game Over'}
                    </motion.div>
                </AnimatePresence>
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
