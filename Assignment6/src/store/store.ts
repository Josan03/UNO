import { gameReducer, GameState, GameAction, initialGameState } from './slices/gameSlice'
import { roomReducer, RoomState, RoomAction, initialRoomState } from './slices/roomSlice'

export interface AppState {
    game: GameState
    room: RoomState
}

export type AppAction =
    | { type: 'game'; action: GameAction }
    | { type: 'room'; action: RoomAction }

export const initialAppState: AppState = {
    game: initialGameState,
    room: initialRoomState,
}

// Combined reducer using the teacher's recommended approach
export function rootReducer(state: AppState, appAction: AppAction): AppState {
    switch (appAction.type) {
        case 'game':
            return {
                ...state,
                game: gameReducer(state.game, appAction.action),
            }
        case 'room':
            return {
                ...state,
                room: roomReducer(state.room, appAction.action),
            }
        default:
            return state
    }
}

