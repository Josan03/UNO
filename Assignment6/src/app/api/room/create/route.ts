import { NextRequest, NextResponse } from 'next/server'
import { createRoom } from '@/lib/rooms'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { hostName, maxPlayers = 4 } = body

        if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
            return NextResponse.json({ error: 'Valid host name is required' }, { status: 400 })
        }

        if (maxPlayers < 2 || maxPlayers > 10) {
            return NextResponse.json({ error: 'Max players must be between 2 and 10' }, { status: 400 })
        }

        const { room, playerId } = createRoom(hostName.trim(), maxPlayers)

        return NextResponse.json({ room, playerId }, { status: 201 })
    } catch (error) {
        console.error('Error creating room:', error)
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        )
    }
}
