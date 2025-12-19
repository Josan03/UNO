import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { LobbyState, GameStateForPlayer, ServerMessage, Card, Color } from '@shared/protocol'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface HistoryEntry {
    id: number
    type: 'CARD_PLAYED' | 'CARD_DRAWN' | 'UNO_CALLED' | 'UNO_CAUGHT'
    playerIndex: number
    playerName: string
    card?: Card
    newColor?: Color
    accusedIndex?: number
    accusedName?: string
    timestamp: number
}

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
    gameHistory: HistoryEntry[]
}

const initialState: GameSliceState = {
    connectionStatus: 'disconnected',
    playerName: '',
    lobby: null,
    game: null,
    error: null,
    lastEvent: null,
    gameHistory: []
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
                    state.game = message.payload
                    state.lobby = null
                    state.gameHistory = [] // Clear history on new game
                    break
                case 'GAME_STATE':
                    state.game = message.payload
                    state.lobby = null
                    break
                case 'CARD_PLAYED': {
                    state.lastEvent = { type: message.type, payload: message.payload }
                    const playerName = state.game?.players[message.payload.playerIndex]?.name ?? 'Unknown'
                    state.gameHistory.push({
                        id: Date.now(),
                        type: 'CARD_PLAYED',
                        playerIndex: message.payload.playerIndex,
                        playerName,
                        card: message.payload.card,
                        newColor: message.payload.newColor,
                        timestamp: Date.now()
                    })
                    break
                }
                case 'CARD_DRAWN': {
                    state.lastEvent = { type: message.type, payload: message.payload }
                    const playerName = state.game?.players[message.payload.playerIndex]?.name ?? 'Unknown'
                    state.gameHistory.push({
                        id: Date.now(),
                        type: 'CARD_DRAWN',
                        playerIndex: message.payload.playerIndex,
                        playerName,
                        timestamp: Date.now()
                    })
                    break
                }
                case 'UNO_CALLED': {
                    state.lastEvent = { type: message.type, payload: message.payload }
                    const playerName = state.game?.players[message.payload.playerIndex]?.name ?? 'Unknown'
                    state.gameHistory.push({
                        id: Date.now(),
                        type: 'UNO_CALLED',
                        playerIndex: message.payload.playerIndex,
                        playerName,
                        timestamp: Date.now()
                    })
                    break
                }
                case 'UNO_CAUGHT': {
                    state.lastEvent = { type: message.type, payload: message.payload }
                    const accuserName = state.game?.players[message.payload.accuser]?.name ?? 'Unknown'
                    const accusedName = state.game?.players[message.payload.accused]?.name ?? 'Unknown'
                    state.gameHistory.push({
                        id: Date.now(),
                        type: 'UNO_CAUGHT',
                        playerIndex: message.payload.accuser,
                        playerName: accuserName,
                        accusedIndex: message.payload.accused,
                        accusedName,
                        timestamp: Date.now()
                    })
                    break
                }
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
            state.gameHistory = []
        },
        returnToLobby: (state) => {
            state.game = null
            state.error = null
            state.lastEvent = null
            state.gameHistory = []
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
