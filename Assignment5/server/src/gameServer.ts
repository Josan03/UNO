import { Subject, Observable, BehaviorSubject } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { Game, createGame, play as gamePlay } from '../../shared/model/uno'
import { Round, play as roundPlay, draw, sayUno, catchUnoFailure, canPlay, topOfDiscard } from '../../shared/model/round'
import { Card, Color } from '../../shared/model/deck'
import {
    ClientMessage,
    ServerMessage,
    LobbyState,
    GameStateForPlayer,
    PublicPlayerState
} from '../../shared/protocol'

// ============================================
// Types
// ============================================

export interface PlayerConnection {
    id: string
    playerName: string
    send: (message: ServerMessage) => void
    isConnected: boolean
}

export interface Lobby {
    id: string
    players: PlayerConnection[]
    hostIndex: number
    game: Game | null
}

// ============================================
// GameServer Class
// ============================================

export class GameServer {
    private lobbies = new Map<string, Lobby>()
    private playerToLobby = new Map<string, string>()
    private playerConnections = new Map<string, PlayerConnection>() // Store player connections

    // RxJS subjects for event streams
    private messageSubject = new Subject<{ playerId: string; message: ClientMessage }>()
    private lobbyUpdateSubject = new Subject<{ lobbyId: string; lobby: Lobby }>()
    private gameEventSubject = new Subject<{ lobbyId: string; event: ServerMessage }>()

    constructor() {
        this.setupMessageHandlers()
    }

    // ============================================
    // Public API
    // ============================================

    handleMessage(playerId: string, message: ClientMessage): void {
        this.messageSubject.next({ playerId, message })
    }

    addPlayer(playerId: string, playerName: string, send: (msg: ServerMessage) => void): PlayerConnection {
        const connection: PlayerConnection = {
            id: playerId,
            playerName,
            send,
            isConnected: true
        }
        // Store the connection so findOrCreatePlayer can find it
        this.playerConnections.set(playerId, connection)
        return connection
    }

    removePlayer(playerId: string): void {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        if (playerIndex === -1) return

        if (lobby.game) {
            // Game in progress - mark as disconnected
            lobby.players[playerIndex].isConnected = false
            this.broadcastToLobby(lobbyId, {
                type: 'PLAYER_DISCONNECTED',
                payload: { playerIndex, playerName: lobby.players[playerIndex].playerName }
            })
        } else {
            // In lobby - remove player
            lobby.players.splice(playerIndex, 1)
            this.playerToLobby.delete(playerId)

            if (lobby.players.length === 0) {
                this.lobbies.delete(lobbyId)
            } else {
                if (lobby.hostIndex >= lobby.players.length) {
                    lobby.hostIndex = 0
                }
                this.broadcastLobbyState(lobbyId)
            }
        }
    }

    reconnectPlayer(playerId: string, newSend: (msg: ServerMessage) => void): boolean {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return false

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return false

        const player = lobby.players.find(p => p.id === playerId)
        if (!player) return false

        player.send = newSend
        player.isConnected = true

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        this.broadcastToLobby(lobbyId, {
            type: 'PLAYER_RECONNECTED',
            payload: { playerIndex, playerName: player.playerName }
        })

        // Send current game state
        if (lobby.game) {
            player.send({
                type: 'GAME_STATE',
                payload: this.getGameStateForPlayer(lobby, playerIndex)
            })
        }

        return true
    }

    // ============================================
    // Message Handlers Setup
    // ============================================

    private setupMessageHandlers(): void {
        // Handle CREATE_LOBBY
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'CREATE_LOBBY')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'CREATE_LOBBY') return
            this.handleCreateLobby(playerId, message.payload)
        })

        // Handle JOIN_LOBBY
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'JOIN_LOBBY')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'JOIN_LOBBY') return
            this.handleJoinLobby(playerId, message.payload)
        })

        // Handle START_GAME
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'START_GAME')
        ).subscribe(({ playerId }) => {
            this.handleStartGame(playerId)
        })

        // Handle PLAY_CARD
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'PLAY_CARD')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'PLAY_CARD') return
            this.handlePlayCard(playerId, message.payload)
        })

        // Handle DRAW_CARD
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'DRAW_CARD')
        ).subscribe(({ playerId }) => {
            this.handleDrawCard(playerId)
        })

        // Handle SAY_UNO
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'SAY_UNO')
        ).subscribe(({ playerId }) => {
            this.handleSayUno(playerId)
        })

        // Handle CATCH_UNO
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'CATCH_UNO')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'CATCH_UNO') return
            this.handleCatchUno(playerId, message.payload)
        })

        // Handle RETURN_TO_LOBBY
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'RETURN_TO_LOBBY')
        ).subscribe(({ playerId }) => {
            this.handleReturnToLobby(playerId)
        })
    }

    // ============================================
    // Lobby Handlers
    // ============================================

    private handleCreateLobby(playerId: string, payload: { playerName: string }): void {
        const lobbyId = uuidv4().substring(0, 8).toUpperCase()

        const playerConnection = this.findOrCreatePlayer(playerId, payload.playerName)

        const lobby: Lobby = {
            id: lobbyId,
            players: [playerConnection],
            hostIndex: 0,
            game: null
        }

        this.lobbies.set(lobbyId, lobby)
        this.playerToLobby.set(playerId, lobbyId)

        playerConnection.send({
            type: 'LOBBY_JOINED',
            payload: this.getLobbyState(lobby)
        })
    }

    private handleJoinLobby(playerId: string, payload: { playerName: string; lobbyId?: string }): void {
        let lobby: Lobby | undefined

        if (payload.lobbyId) {
            lobby = this.lobbies.get(payload.lobbyId.toUpperCase())
        } else {
            // Find any open lobby
            for (const [, l] of this.lobbies) {
                if (!l.game && l.players.length < 10) {
                    lobby = l
                    break
                }
            }
        }

        if (!lobby) {
            const player = this.findOrCreatePlayer(playerId, payload.playerName)
            player.send({ type: 'ERROR', payload: { message: 'Lobby not found' } })
            return
        }

        if (lobby.game) {
            const player = this.findOrCreatePlayer(playerId, payload.playerName)
            player.send({ type: 'ERROR', payload: { message: 'Game already in progress' } })
            return
        }

        if (lobby.players.length >= 10) {
            const player = this.findOrCreatePlayer(playerId, payload.playerName)
            player.send({ type: 'ERROR', payload: { message: 'Lobby is full' } })
            return
        }

        const playerConnection = this.findOrCreatePlayer(playerId, payload.playerName)
        lobby.players.push(playerConnection)
        this.playerToLobby.set(playerId, lobby.id)

        this.broadcastLobbyState(lobby.id)
    }

    private handleStartGame(playerId: string): void {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        if (playerIndex !== lobby.hostIndex) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Only the host can start the game' }
            })
            return
        }

        if (lobby.players.length < 2) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Need at least 2 players to start' }
            })
            return
        }

        // Create the game (single round - first to empty hand wins)
        const playerNames = lobby.players.map(p => p.playerName)
        lobby.game = createGame({
            players: playerNames,
            targetScore: 1 // Single round game
        })

        // Send game state to all players
        lobby.players.forEach((player, idx) => {
            player.send({
                type: 'GAME_STARTED',
                payload: this.getGameStateForPlayer(lobby, idx)
            })
        })
    }

    // ============================================
    // Game Action Handlers
    // ============================================

    private handlePlayCard(playerId: string, payload: { cardIndex: number; namedColor?: Color }): void {
        const { lobby, playerIndex } = this.getPlayerContext(playerId)
        if (!lobby?.game?.currentRound) return

        const round = lobby.game.currentRound
        if (round.playerInTurn !== playerIndex) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Not your turn' }
            })
            return
        }

        try {
            const card = round.hands[playerIndex][payload.cardIndex]
            const newColor = payload.namedColor || card.color!

            lobby.game = gamePlay(
                (r: Round) => roundPlay(payload.cardIndex, payload.namedColor, r),
                lobby.game
            )

            // Broadcast card played
            this.broadcastToLobby(lobby.id, {
                type: 'CARD_PLAYED',
                payload: { playerIndex, card, newColor }
            })

            this.broadcastGameState(lobby)
            this.checkRoundEnd(lobby)
        } catch (error: any) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: error.message }
            })
        }
    }

    private handleDrawCard(playerId: string): void {
        const { lobby, playerIndex } = this.getPlayerContext(playerId)
        if (!lobby?.game?.currentRound) return

        const round = lobby.game.currentRound
        if (round.playerInTurn !== playerIndex) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Not your turn' }
            })
            return
        }

        try {
            lobby.game = gamePlay((r: Round) => draw(r), lobby.game)

            this.broadcastToLobby(lobby.id, {
                type: 'CARD_DRAWN',
                payload: { playerIndex }
            })

            this.broadcastGameState(lobby)
        } catch (error: any) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: error.message }
            })
        }
    }

    private handleSayUno(playerId: string): void {
        const { lobby, playerIndex } = this.getPlayerContext(playerId)
        if (!lobby?.game?.currentRound) return

        try {
            lobby.game = gamePlay((r: Round) => sayUno(playerIndex, r), lobby.game)

            this.broadcastToLobby(lobby.id, {
                type: 'UNO_CALLED',
                payload: { playerIndex }
            })

            this.broadcastGameState(lobby)
        } catch (error: any) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: error.message }
            })
        }
    }

    private handleCatchUno(playerId: string, payload: { accusedPlayerIndex: number }): void {
        const { lobby, playerIndex } = this.getPlayerContext(playerId)
        if (!lobby?.game?.currentRound) return

        try {
            const oldRound = lobby.game.currentRound
            lobby.game = gamePlay(
                (r: Round) => catchUnoFailure({ accuser: playerIndex, accused: payload.accusedPlayerIndex }, r),
                lobby.game
            )

            // Check if catch was successful (hand size changed)
            if (lobby.game.currentRound &&
                lobby.game.currentRound.hands[payload.accusedPlayerIndex].length >
                oldRound.hands[payload.accusedPlayerIndex].length) {
                this.broadcastToLobby(lobby.id, {
                    type: 'UNO_CAUGHT',
                    payload: { accuser: playerIndex, accused: payload.accusedPlayerIndex }
                })
            }

            this.broadcastGameState(lobby)
        } catch (error: any) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: error.message }
            })
        }
    }

    // ============================================
    // Helper Methods
    // ============================================

    private findOrCreatePlayer(playerId: string, playerName: string): PlayerConnection {
        // Check if player exists in any lobby
        for (const [, lobby] of this.lobbies) {
            const existing = lobby.players.find(p => p.id === playerId)
            if (existing) {
                existing.playerName = playerName
                return existing
            }
        }

        // Check if we have a stored connection from addPlayer
        const storedConnection = this.playerConnections.get(playerId)
        if (storedConnection) {
            storedConnection.playerName = playerName
            return storedConnection
        }

        // Create new placeholder - will be replaced when proper connection established
        console.warn(`Creating placeholder connection for ${playerId} - this should not happen`)
        return {
            id: playerId,
            playerName,
            send: () => { },
            isConnected: true
        }
    }

    private getPlayerContext(playerId: string): { lobby: Lobby | null; playerIndex: number } {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return { lobby: null, playerIndex: -1 }

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return { lobby: null, playerIndex: -1 }

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        return { lobby, playerIndex }
    }

    private getLobbyState(lobby: Lobby): LobbyState {
        return {
            lobbyId: lobby.id,
            players: lobby.players.map(p => p.playerName),
            hostIndex: lobby.hostIndex,
            isStarted: lobby.game !== null
        }
    }

    private getGameStateForPlayer(lobby: Lobby, playerIndex: number): GameStateForPlayer {
        const game = lobby.game!
        const round = game.currentRound

        const players: PublicPlayerState[] = lobby.players.map((p, idx) => ({
            name: p.playerName,
            cardCount: round ? round.hands[idx].length : 0,
            isConnected: p.isConnected
        }))

        const hand = round ? round.hands[playerIndex] : []
        const isMyTurn = round?.playerInTurn === playerIndex

        // Pre-compute which cards can be played
        const canPlayCards = hand.map((_, idx) => {
            if (!round || !isMyTurn) return false
            return canPlay(idx, round)
        })

        return {
            lobbyId: lobby.id,
            playerIndex,
            playerName: lobby.players[playerIndex].playerName,
            players,
            round: round ? {
                topCard: topOfDiscard(round),
                currentColor: round.currentColor,
                currentDirection: round.currentDirection,
                playerInTurn: round.playerInTurn,
                drawPileSize: round.drawPile.length,
                handSizes: round.hands.map(h => h.length),
                unoCalledBy: round.unoCalled.map((called, idx) => called ? idx : -1).filter(idx => idx >= 0)
            } : null,
            hand,
            canPlayCards,
            canDrawCard: isMyTurn,
            isMyTurn,
            winner: game.winner
        }
    }

    private broadcastLobbyState(lobbyId: string): void {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        const state = this.getLobbyState(lobby)
        lobby.players.forEach(player => {
            player.send({ type: 'LOBBY_UPDATED', payload: state })
        })
    }

    private broadcastGameState(lobby: Lobby): void {
        lobby.players.forEach((player, idx) => {
            player.send({
                type: 'GAME_STATE',
                payload: this.getGameStateForPlayer(lobby, idx)
            })
        })
    }

    private broadcastToLobby(lobbyId: string, message: ServerMessage): void {
        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        lobby.players.forEach(player => {
            if (player.isConnected) {
                player.send(message)
            }
        })
    }

    private checkRoundEnd(lobby: Lobby): void {
        if (!lobby.game) return

        // Check if game ended (someone won the round)
        if (lobby.game.currentRound?.playerInTurn === undefined) {
            const winnerIndex = lobby.game.currentRound?.hands.findIndex(h => h.length === 0) ?? -1
            if (winnerIndex >= 0) {
                this.broadcastToLobby(lobby.id, {
                    type: 'GAME_ENDED',
                    payload: {
                        winner: winnerIndex,
                        winnerName: lobby.players[winnerIndex].playerName
                    }
                })
            }
        }
    }

    private handleReturnToLobby(playerId: string): void {
        const { lobby } = this.getPlayerContext(playerId)
        if (!lobby) return

        // Reset the game
        lobby.game = null

        // Broadcast lobby state to all players
        this.broadcastLobbyState(lobby.id)
    }
}
