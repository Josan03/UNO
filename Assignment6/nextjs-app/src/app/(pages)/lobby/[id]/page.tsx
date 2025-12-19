import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import LobbyClient from './LobbyClient'

interface LobbyPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ create?: string; maxPlayers?: string }>
}

export default async function LobbyPage({ params, searchParams }: LobbyPageProps) {
  const { id: lobbyId } = await params
  const { create, maxPlayers } = await searchParams
  
  // Server-side: Check if player is logged in
  const cookieStore = await cookies()
  const playerName = cookieStore.get('playerName')?.value

  // Redirect to login if not logged in
  if (!playerName) {
    redirect('/login')
  }

  const isCreating = create === 'true'
  const maxPlayersNum = maxPlayers ? parseInt(maxPlayers) : 4

  // Server-side rendered lobby page
  return (
    <LobbyClient 
      lobbyId={lobbyId} 
      playerName={playerName}
      isCreating={isCreating}
      maxPlayers={maxPlayersNum}
    />
  )
}
