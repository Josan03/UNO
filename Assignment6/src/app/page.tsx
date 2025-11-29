'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900 overflow-hidden relative">
      {/* Floating cards background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-24 rounded-xl shadow-2xl"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${(i * 20) % 100}%`,
              background: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i % 4],
              rotate: Math.random() * 360
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      <main className="flex flex-col items-center justify-center gap-8 p-8 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.8
          }}
        >
          <h1 className="text-8xl font-bold text-white tracking-wider drop-shadow-2xl">
            UNO
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-2xl text-white/90 text-center max-w-2xl"
        >
          Do you enjoy playing Uno game with your friends, or solo? Now you can play
          Uno online with multiplayer mode or practice your skills against AI bots
          in single-player mode. Join a room, invite your friends, and let the fun
          begin!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col gap-4 mt-8"
        >
          <Link
            href="/lobby"
            className="px-8 py-4 text-xl font-semibold text-green-900 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
          >
            Start New Game
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
