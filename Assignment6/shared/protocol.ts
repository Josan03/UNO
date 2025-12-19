import { Card, Color } from './model/deck'
import { Direction } from './model/round'

export type { Card, Color }

export type ClientMessage =
    | { type: 'JOIN_LOBBY'; payload: { playerName: string; lobbyId?: string } }
    | { type: 'CREATE_LOBBY'; payload: { playerName: string; maxPlayers: number } }
    | { type: 'ADD_BOT'; payload: { difficulty?: 'easy' | 'medium' | 'hard' } }
    | { type: 'REMOVE_BOT'; payload: { botIndex: number } }
    | { type: 'START_GAME'; payload: {} }
    | { type: 'PLAY_CARD'; payload: { cardIndex: number; namedColor?: Color } }
    | { type: 'DRAW_CARD'; payload: {} }
    | { type: 'SAY_UNO'; payload: {} }
    | { type: 'CATCH_UNO'; payload: { accusedPlayerIndex: number } }
    | { type: 'RETURN_TO_LOBBY'; payload: {} }

export type ServerMessage =
    | { type: 'LOBBY_JOINED'; payload: LobbyState }
    | { type: 'LOBBY_UPDATED'; payload: LobbyState }
    | { type: 'GAME_STARTED'; payload: GameStateForPlayer }
    | { type: 'GAME_STATE'; payload: GameStateForPlayer }
    | { type: 'CARD_PLAYED'; payload: { playerIndex: number; card: Card; newColor: Color } }
    | { type: 'CARD_DRAWN'; payload: { playerIndex: number } }
    | { type: 'UNO_CALLED'; payload: { playerIndex: number } }
    | { type: 'UNO_CAUGHT'; payload: { accuser: number; accused: number } }
    | { type: 'GAME_ENDED'; payload: GameEndInfo }
    | { type: 'ERROR'; payload: { message: string } }
    | { type: 'PLAYER_DISCONNECTED'; payload: { playerIndex: number; playerName: string } }
    | { type: 'PLAYER_RECONNECTED'; payload: { playerIndex: number; playerName: string } }

export interface LobbyState {
    lobbyId: string
    players: string[]
    hostIndex: number
    maxPlayers: number
    isStarted: boolean
    botPlayers: number[]
}

export interface PublicPlayerState {
    name: string
    cardCount: number
    isConnected: boolean
    isBot: boolean
}

export interface GameStateForPlayer {
    lobbyId: string

    playerIndex: number
    playerName: string

    players: PublicPlayerState[]

    round: {
        topCard: Card
        currentColor: Color
        currentDirection: Direction
        playerInTurn: number | undefined
        drawPileSize: number
        handSizes: number[]
        unoCalledBy: number[]
    } | null

    hand: Card[]
    canPlayCards: boolean[]
    canDrawCard: boolean
    isMyTurn: boolean

    winner: number | undefined
}

export interface GameEndInfo {
    winner: number
    winnerName: string
}

export type MessageHandler<T> = (message: T) => void
