import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setPlayerReady, addBotToRoom, removeBotFromRoom } from '@/lib/rooms'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    const room = getRoom(code.toUpperCase())

    if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ room }, { status: 200 })
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params
        const body = await req.json()
        const { action, playerId, ready, botId } = body

        let room

        switch (action) {
            case 'ready':
                if (!playerId || typeof ready !== 'boolean') {
                    return NextResponse.json(
                        { error: 'Valid playerId and ready status required' },
                        { status: 400 }
                    )
                }
                room = setPlayerReady(code.toUpperCase(), playerId, ready)
                break

            case 'addBot':
                room = addBotToRoom(code.toUpperCase())
                break

            case 'removeBot':
                if (!botId) {
                    return NextResponse.json({ error: 'Bot ID required' }, { status: 400 })
                }
                room = removeBotFromRoom(code.toUpperCase(), botId)
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        return NextResponse.json({ room }, { status: 200 })
    } catch (error) {
        console.error('Error updating room:', error)
        const message = error instanceof Error ? error.message : 'Failed to update room'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
