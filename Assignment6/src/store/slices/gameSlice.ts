import { Card, Color } from '@/lib/game/deck'

export interface RoundState {
    players: string[]
    playerInTurn: number | undefined
    currentColor: Color
    currentDirection: 'clockwise' | 'counterclockwise'
    hands: Card[][]
    discardPile: Card[]
    drawPileCount: number
}

export interface GameState {
    sessionId: string | null
    roundState: RoundState | null
    loading: boolean
    error: string | null
    isMultiplayer: boolean
    roomCode: string | null
}

export const initialGameState: GameState = {
    sessionId: null,
    roundState: null,
    loading: true,
    error: null,
    isMultiplayer: false,
    roomCode: null,
}

export type GameAction =
    | { type: 'SET_SESSION_ID'; payload: string }
    | { type: 'SET_ROUND_STATE'; payload: RoundState }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_GAME_MODE'; payload: { isMultiplayer: boolean; roomCode: string | null } }
    | { type: 'RESET_GAME' }

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_SESSION_ID':
            return { ...state, sessionId: action.payload }
        case 'SET_ROUND_STATE':
            return { ...state, roundState: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload }
        case 'SET_GAME_MODE':
            return {
                ...state,
                isMultiplayer: action.payload.isMultiplayer,
                roomCode: action.payload.roomCode,
            }
        case 'RESET_GAME':
            return initialGameState
        default:
            return state
    }
}

