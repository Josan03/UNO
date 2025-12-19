import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import HomeClient from './(pages)/HomeClient'

export default async function Home() {
  // Server-side: Check if player is logged in
  const cookieStore = await cookies()
  const playerName = cookieStore.get('playerName')?.value

  // Redirect to login if not logged in
  if (!playerName) {
    redirect('/login')
  }

  // Server-side rendered page with player name
  return <HomeClient playerName={playerName} />
}
