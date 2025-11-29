import { v4 as uuidv4 } from 'uuid'
import { createRound, Round } from './game/round'
import { generateSessionId, saveGameSession } from './session'

export interface Player {
    id: string
    name: string
    type: 'human' | 'bot'
    ready: boolean
}

export interface Room {
    code: string
    players: Player[]
    maxPlayers: number
    hostId: string
    status: 'waiting' | 'playing' | 'finished'
    sessionId?: string
}

const rooms = new Map<string, Room>()

export function generateRoomCode(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like I, O, 1, 0
    let code: string
    do {
        code = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    } while (rooms.has(code))
    return code
}

export function createRoom(hostName: string, maxPlayers: number = 4): { room: Room; playerId: string } {
    const code = generateRoomCode()
    const playerId = uuidv4()

    const room: Room = {
        code,
        players: [{
            id: playerId,
            name: hostName,
            type: 'human',
            ready: false,
        }],
        maxPlayers,
        hostId: playerId,
        status: 'waiting',
    }

    rooms.set(code, room)
    return { room, playerId }
}

export function getRoom(code: string): Room | undefined {
    return rooms.get(code)
}

export function joinRoom(code: string, playerName: string): { room: Room; playerId: string } | null {
    const room = rooms.get(code)
    if (!room) {
        return null
    }

    if (room.status !== 'waiting') {
        throw new Error('Game already started')
    }

    if (room.players.length >= room.maxPlayers) {
        throw new Error('Room is full')
    }

    // Check for duplicate names
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        throw new Error('Name already taken')
    }

    const playerId = uuidv4()
    room.players.push({
        id: playerId,
        name: playerName,
        type: 'human',
        ready: false,
    })

    return { room, playerId }
}

export function setPlayerReady(code: string, playerId: string, ready: boolean): Room | null {
    const room = rooms.get(code)
    if (!room) return null

    const player = room.players.find(p => p.id === playerId)
    if (!player) return null

    player.ready = ready
    return room
}

export function addBotToRoom(code: string): Room | null {
    const room = rooms.get(code)
    if (!room) return null

    if (room.status !== 'waiting') {
        throw new Error('Cannot add bots after game started')
    }

    if (room.players.length >= room.maxPlayers) {
        throw new Error('Room is full')
    }

    const botNumber = room.players.filter(p => p.type === 'bot').length + 1
    const botId = uuidv4()

    room.players.push({
        id: botId,
        name: `Bot-${botNumber}`,
        type: 'bot',
        ready: true, // Bots are always ready
    })

    return room
}

export function removeBotFromRoom(code: string, botId: string): Room | null {
    const room = rooms.get(code)
    if (!room) return null

    const botIndex = room.players.findIndex(p => p.id === botId && p.type === 'bot')
    if (botIndex === -1) {
        throw new Error('Bot not found')
    }

    room.players.splice(botIndex, 1)
    return room
}

export function canStartGame(room: Room): boolean {
    // Need at least 2 players
    if (room.players.length < 2) return false

    // All human players must be ready
    const allHumansReady = room.players.filter(p => p.type === 'human').every(p => p.ready)
    return allHumansReady
}

export function startGame(code: string): { room: Room; sessionId: string } | null {
    const room = rooms.get(code)
    if (!room) return null

    if (!canStartGame(room)) {
        throw new Error('Not all players are ready')
    }

    // Create game session
    const playerNames = room.players.map(p => p.name)
    const dealer = 0
    const round = createRound(playerNames, dealer)
    const sessionId = generateSessionId()
    saveGameSession(sessionId, round)

    room.status = 'playing'
    room.sessionId = sessionId

    return { room, sessionId }
}

export function deleteRoom(code: string): void {
    rooms.delete(code)
}
