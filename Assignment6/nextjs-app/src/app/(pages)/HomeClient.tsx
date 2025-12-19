'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HomeClientProps {
  playerName: string
}

export default function HomeClient({ playerName }: HomeClientProps) {
  const router = useRouter()
  const [lobbyCode, setLobbyCode] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)

  const handleCreateLobby = async () => {
    // Generate a random lobby ID
    const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Redirect to lobby page where WebSocket connection will be established
    router.push(`/lobby/${lobbyId}?create=true&maxPlayers=${maxPlayers}`)
  }

  const handleJoinLobby = () => {
    if (!lobbyCode.trim()) return
    
    // Redirect to lobby page
    router.push(`/lobby/${lobbyCode.toUpperCase()}`)
  }

  const handleLogout = async () => {
    // Clear cookie via server action
    await fetch('/api/auth/logout', { method: 'POST' })
    // Navigate to login
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-56 bg-gradient-to-br from-uno-red to-red-700 
          rounded-2xl rotate-[-15deg] opacity-20 blur-sm" />
        <div className="absolute top-40 -right-10 w-32 h-44 bg-gradient-to-br from-uno-blue to-blue-700 
          rounded-2xl rotate-[25deg] opacity-20 blur-sm" />
        <div className="absolute -bottom-10 left-1/4 w-36 h-48 bg-gradient-to-br from-uno-green to-green-700 
          rounded-2xl rotate-[10deg] opacity-20 blur-sm" />
        <div className="absolute bottom-40 right-1/4 w-28 h-40 bg-gradient-to-br from-uno-yellow to-yellow-600 
          rounded-2xl rotate-[-20deg] opacity-20 blur-sm" />
      </div>

      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-6xl font-black text-white italic tracking-tight drop-shadow-lg">
              UNO
            </h1>
          </div>
          <p className="text-white/50 text-sm mt-2 font-medium tracking-wide">MULTIPLAYER</p>
        </div>

        {/* Player Name Display */}
        <div className="mb-6 flex items-center justify-between glass-dark rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-uno-blue/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white font-semibold">{playerName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white/80 text-xs transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="space-y-5">
          {/* Player Count */}
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
              PLAYERS
            </label>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setMaxPlayers(num)}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                    maxPlayers === num
                      ? 'bg-gradient-to-r from-uno-blue to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Create Lobby Button */}
          <button
            onClick={handleCreateLobby}
            className="w-full py-3.5 rounded-xl font-bold text-white 
              bg-gradient-to-r from-uno-blue to-blue-600 
              hover:from-uno-blue/90 hover:to-blue-600/90
              shadow-lg hover:shadow-xl transition-all duration-200
              transform hover:scale-[1.02] active:scale-[0.98]"
          >
            CREATE LOBBY
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1a2e] text-white/40 font-semibold">OR</span>
            </div>
          </div>

          {/* Join Lobby */}
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
              JOIN WITH CODE
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 text-white 
                  placeholder-white/30 border border-white/10 
                  focus:border-uno-green/50 focus:bg-white/15 focus:outline-none
                  transition-all duration-200 font-mono font-bold text-center tracking-widest"
                maxLength={6}
              />
              <button
                onClick={handleJoinLobby}
                disabled={!lobbyCode.trim()}
                className="px-6 py-3.5 rounded-xl font-bold text-white 
                  bg-gradient-to-r from-uno-green to-green-600 
                  hover:from-uno-green/90 hover:to-green-600/90
                  disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed
                  shadow-lg hover:shadow-xl transition-all duration-200
                  transform hover:scale-[1.02] active:scale-[0.98]"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
