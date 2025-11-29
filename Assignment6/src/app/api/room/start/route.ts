import { NextRequest, NextResponse } from 'next/server'
import { startGame } from '@/lib/rooms'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { code } = body

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Valid room code is required' }, { status: 400 })
        }

        const result = startGame(code.toUpperCase().trim())

        if (!result) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        console.error('Error starting game:', error)
        const message = error instanceof Error ? error.message : 'Failed to start game'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
