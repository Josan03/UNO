import { cookies } from 'next/headers'

// Helper to get player name from cookies
export async function getPlayerName(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('playerName')?.value
}

// Helper to set player name in cookies
export async function setPlayerName(name: string) {
  const cookieStore = await cookies()
  cookieStore.set('playerName', name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}

// API functions to interact with the game server
// Note: Since the UNO game uses WebSocket, we'll create helpers for server-side data
// The actual game logic will still use WebSocket from client components

export interface LobbyInfo {
  id: string
  players: string[]
  hostIndex: number
  maxPlayers: number
  botIndices?: number[]
}

export interface GameInfo {
  lobbyId: string
  players: string[]
  currentPlayerIndex: number
  playerIndex: number
}

// Mock data fetchers - in a real implementation, these would query a REST API
// or database that tracks lobby/game state
export async function getLobbyInfo(lobbyId: string): Promise<LobbyInfo | null> {
  // In a real implementation, this would fetch from a REST API endpoint
  // that queries the game server state
  // For now, return null to indicate we need to connect via WebSocket
  return null
}

export async function getGameInfo(lobbyId: string): Promise<GameInfo | null> {
  // In a real implementation, this would fetch from a REST API endpoint
  // For now, return null to indicate we need to connect via WebSocket
  return null
}

// Server action to create a lobby
export async function createLobby(playerName: string, maxPlayers: number = 4): Promise<string> {
  // This would call a REST API endpoint to create a lobby
  // For now, we'll return a mock ID
  const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()
  return lobbyId
}

// Server action to join a lobby
export async function joinLobby(playerName: string, lobbyId: string): Promise<boolean> {
  // This would call a REST API endpoint to join a lobby
  // For now, return true
  return true
}
