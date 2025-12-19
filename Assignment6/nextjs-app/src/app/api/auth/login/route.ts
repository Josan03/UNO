import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { playerName } = await request.json()
    
    if (!playerName || typeof playerName !== 'string') {
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set('playerName', playerName.trim(), {
      httpOnly: false, // Need to be accessible from client for WebSocket
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set player name' }, { status: 500 })
  }
}
