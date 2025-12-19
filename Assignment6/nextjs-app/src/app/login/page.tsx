'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setLoading(true)
      setError('')
      
      try {
        // Set cookie via server action
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: name.trim() })
        })
        
        if (response.ok) {
          router.push('/')
          router.refresh()
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to login')
        }
      } catch (err) {
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2 tracking-wide">
              ENTER YOUR NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 text-white 
                placeholder-white/30 border border-white/10 
                focus:border-uno-blue/50 focus:bg-white/15 focus:outline-none
                transition-all duration-200 font-medium"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-uno-red text-sm text-center bg-uno-red/10 border border-uno-red/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3.5 rounded-xl font-bold text-white 
              bg-gradient-to-r from-uno-blue to-blue-600 
              hover:from-uno-blue/90 hover:to-blue-600/90
              disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl transition-all duration-200
              transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'LOADING...' : 'CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  )
}
