import { Room } from '@/lib/rooms'

export interface RoomState {
    room: Room | null
    playerId: string | null
    loading: boolean
    error: string | null
}

export const initialRoomState: RoomState = {
    room: null,
    playerId: null,
    loading: false,
    error: null,
}

export type RoomAction =
    | { type: 'SET_ROOM'; payload: Room }
    | { type: 'SET_PLAYER_ID'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_ROOM' }

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
    switch (action.type) {
        case 'SET_ROOM':
            return { ...state, room: action.payload }
        case 'SET_PLAYER_ID':
            return { ...state, playerId: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload }
        case 'RESET_ROOM':
            return initialRoomState
        default:
            return state
    }
}

