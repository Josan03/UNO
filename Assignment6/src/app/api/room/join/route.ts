import { NextRequest, NextResponse } from 'next/server'
import { joinRoom } from '@/lib/rooms'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { code, playerName } = body

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Valid room code is required' }, { status: 400 })
        }

        if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
            return NextResponse.json({ error: 'Valid player name is required' }, { status: 400 })
        }

        const result = joinRoom(code.toUpperCase().trim(), playerName.trim())

        if (!result) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        console.error('Error joining room:', error)
        const message = error instanceof Error ? error.message : 'Failed to join room'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
