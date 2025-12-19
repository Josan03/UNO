import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { LobbyState, GameStateForPlayer, ServerMessage } from '@shared/protocol'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

interface GameSliceState {
    connectionStatus: ConnectionStatus
    playerName: string
    lobby: LobbyState | null
    game: GameStateForPlayer | null
    error: string | null
    lastEvent: {
        type: string
        payload?: any
    } | null
}

const initialState: GameSliceState = {
    connectionStatus: 'disconnected',
    playerName: '',
    lobby: null,
    game: null,
    error: null,
    lastEvent: null
}

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
            state.connectionStatus = action.payload
        },
        setPlayerName: (state, action: PayloadAction<string>) => {
            state.playerName = action.payload
        },
        setLobby: (state, action: PayloadAction<LobbyState | null>) => {
            state.lobby = action.payload
        },
        setGame: (state, action: PayloadAction<GameStateForPlayer | null>) => {
            state.game = action.payload
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },
        setLastEvent: (state, action: PayloadAction<{ type: string; payload?: any } | null>) => {
            state.lastEvent = action.payload
        },
        handleServerMessage: (state, action: PayloadAction<ServerMessage>) => {
            const message = action.payload
            state.error = null

            switch (message.type) {
                case 'LOBBY_JOINED':
                case 'LOBBY_UPDATED':
                    state.lobby = message.payload
                    break
                case 'GAME_STARTED':
                case 'GAME_STATE':
                    state.game = message.payload
                    state.lobby = null
                    break
                case 'CARD_PLAYED':
                case 'CARD_DRAWN':
                case 'UNO_CALLED':
                case 'UNO_CAUGHT':
                    state.lastEvent = { type: message.type, payload: message.payload }
                    break
                case 'GAME_ENDED':
                    if (state.game) {
                        state.game.winner = message.payload.winner
                    }
                    state.lastEvent = { type: 'GAME_ENDED', payload: message.payload }
                    break
                case 'ERROR':
                    state.error = message.payload.message
                    break
                case 'PLAYER_DISCONNECTED':
                case 'PLAYER_RECONNECTED':
                    state.lastEvent = { type: message.type, payload: message.payload }
                    break
            }
        },
        resetGame: (state) => {
            state.lobby = null
            state.game = null
            state.error = null
            state.lastEvent = null
        },
        returnToLobby: (state) => {
            state.game = null
            state.error = null
            state.lastEvent = null
        }
    }
})

export const {
    setConnectionStatus,
    setPlayerName,
    setLobby,
    setGame,
    setError,
    setLastEvent,
    handleServerMessage,
    resetGame,
    returnToLobby
} = gameSlice.actions

export default gameSlice.reducer
