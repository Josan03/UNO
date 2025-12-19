import { cookies } from 'next/headers'

export async function getPlayerName(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('playerName')?.value
}

export async function setPlayerName(name: string) {
  const cookieStore = await cookies()
  cookieStore.set('playerName', name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  })
}

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

export async function getLobbyInfo(lobbyId: string): Promise<LobbyInfo | null> {
  return null
}

export async function getGameInfo(lobbyId: string): Promise<GameInfo | null> {
  return null
}

export async function createLobby(playerName: string, maxPlayers: number = 4): Promise<string> {
  const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase()
  return lobbyId
}

export async function joinLobby(playerName: string, lobbyId: string): Promise<boolean> {
  return true
}
