import { Round } from './game/round'
import { v4 as uuidv4 } from 'uuid'

// In-memory session store (for development)
// In production, consider Redis or a database
const sessions = new Map<string, Round>()

export function generateSessionId(): string {
    return uuidv4()
}

export function saveGameSession(sessionId: string, round: Round): void {
    sessions.set(sessionId, round)
}

export function getGameSession(sessionId: string): Round | undefined {
    return sessions.get(sessionId)
}

export function deleteGameSession(sessionId: string): boolean {
    return sessions.delete(sessionId)
}

export function getAllSessions(): string[] {
    return Array.from(sessions.keys())
}
