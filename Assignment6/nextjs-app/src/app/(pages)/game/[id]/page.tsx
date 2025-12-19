import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import GameClient from './GameClient'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { id: lobbyId } = await params
  
  // Server-side: Check if player is logged in
  const cookieStore = await cookies()
  const playerName = cookieStore.get('playerName')?.value

  // Redirect to login if not logged in
  if (!playerName) {
    redirect('/login')
  }

  // Server-side rendered game page
  return <GameClient lobbyId={lobbyId} playerName={playerName} />
}
