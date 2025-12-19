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
import { makeBotDecision, shouldCallUno, shouldCatchUno, generateBotName, resetBotNames, BotDifficulty } from './botAI'

// ============================================
// Types
// ============================================

export interface PlayerConnection {
    id: string
    playerName: string
    send: (message: ServerMessage) => void
    isConnected: boolean
    isBot: boolean
    botDifficulty?: BotDifficulty
}

export interface Lobby {
    id: string
    players: PlayerConnection[]
    hostIndex: number
    maxPlayers: number
    game: Game | null
    botIndices: number[] // Track which player indices are bots
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
            isConnected: true,
            isBot: false
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

        // Handle ADD_BOT
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'ADD_BOT')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'ADD_BOT') return
            this.handleAddBot(playerId, message.payload?.difficulty || 'hard')
        })

        // Handle REMOVE_BOT
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'REMOVE_BOT')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'REMOVE_BOT') return
            this.handleRemoveBot(playerId, message.payload.botIndex)
        })
    }

    // ============================================
    // Lobby Handlers
    // ============================================

    private handleCreateLobby(playerId: string, payload: { playerName: string; maxPlayers: number }): void {
        const lobbyId = uuidv4().substring(0, 8).toUpperCase()

        const playerConnection = this.findOrCreatePlayer(playerId, payload.playerName)
        resetBotNames() // Reset bot names for new lobby

        const lobby: Lobby = {
            id: lobbyId,
            players: [playerConnection],
            hostIndex: 0,
            maxPlayers: Math.min(Math.max(payload.maxPlayers || 4, 2), 10), // Clamp between 2-10
            game: null,
            botIndices: []
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
                if (!l.game && l.players.length < l.maxPlayers) {
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

        if (lobby.players.length >= lobby.maxPlayers) {
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

        // Check if it's a bot's turn first
        this.scheduleBotMoveIfNeeded(lobby)
    }

    // ============================================
    // Bot Handlers
    // ============================================

    private handleAddBot(playerId: string, difficulty: BotDifficulty): void {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        if (playerIndex !== lobby.hostIndex) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Only the host can add bots' }
            })
            return
        }

        if (lobby.game) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Cannot add bots during a game' }
            })
            return
        }

        if (lobby.players.length >= lobby.maxPlayers) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Lobby is full' }
            })
            return
        }

        // Create bot player
        const botId = `bot_${uuidv4().substring(0, 8)}`
        const botName = generateBotName()
        const botConnection: PlayerConnection = {
            id: botId,
            playerName: botName,
            send: () => { }, // Bots don't receive messages
            isConnected: true,
            isBot: true,
            botDifficulty: difficulty
        }

        const botIndex = lobby.players.length
        lobby.players.push(botConnection)
        lobby.botIndices.push(botIndex)
        this.playerToLobby.set(botId, lobby.id)

        this.broadcastLobbyState(lobby.id)
    }

    private handleRemoveBot(playerId: string, botIndex: number): void {
        const lobbyId = this.playerToLobby.get(playerId)
        if (!lobbyId) return

        const lobby = this.lobbies.get(lobbyId)
        if (!lobby) return

        const playerIndex = lobby.players.findIndex(p => p.id === playerId)
        if (playerIndex !== lobby.hostIndex) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Only the host can remove bots' }
            })
            return
        }

        if (lobby.game) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Cannot remove bots during a game' }
            })
            return
        }

        if (botIndex < 0 || botIndex >= lobby.players.length) {
            return
        }

        const player = lobby.players[botIndex]
        if (!player.isBot) {
            lobby.players[playerIndex].send({
                type: 'ERROR',
                payload: { message: 'Cannot remove human players' }
            })
            return
        }

        // Remove bot
        this.playerToLobby.delete(player.id)
        lobby.players.splice(botIndex, 1)

        // Update botIndices
        lobby.botIndices = lobby.players
            .map((p, idx) => p.isBot ? idx : -1)
            .filter(idx => idx >= 0)

        // Update host index if needed
        if (lobby.hostIndex >= lobby.players.length) {
            lobby.hostIndex = 0
        }

        this.broadcastLobbyState(lobby.id)
    }

    private scheduleBotMoveIfNeeded(lobby: Lobby): void {
        if (!lobby.game?.currentRound) return

        const round = lobby.game.currentRound
        if (round.playerInTurn === undefined) return

        const currentPlayer = lobby.players[round.playerInTurn]
        if (!currentPlayer?.isBot) return

        // Schedule bot move with delay for realism
        const delay = 800 + Math.random() * 1200 // 0.8-2 seconds
        setTimeout(() => {
            this.executeBotMove(lobby, round.playerInTurn!)
        }, delay)
    }

    private executeBotMove(lobby: Lobby, botIndex: number): void {
        if (!lobby.game?.currentRound) return

        const round = lobby.game.currentRound
        if (round.playerInTurn !== botIndex) return // Turn already changed

        const bot = lobby.players[botIndex]
        if (!bot?.isBot) return

        try {
            // First, check if bot should catch someone for UNO failure
            const catchTarget = shouldCatchUno(round, botIndex)
            if (catchTarget !== null) {
                // Small chance bot catches (makes game more interesting)
                if (Math.random() < 0.7) {
                    this.executeBotCatchUno(lobby, botIndex, catchTarget)
                    // Small delay before making actual move
                    setTimeout(() => {
                        this.executeBotMove(lobby, botIndex)
                    }, 500)
                    return
                }
            }

            // Make decision
            const decision = makeBotDecision(round, botIndex, bot.botDifficulty || 'hard')

            if (decision.action === 'draw') {
                // Draw card
                lobby.game = gamePlay((r: Round) => draw(r), lobby.game)

                this.broadcastToLobby(lobby.id, {
                    type: 'CARD_DRAWN',
                    payload: { playerIndex: botIndex }
                })
            } else if (decision.action === 'play' && decision.cardIndex !== undefined) {
                const card = round.hands[botIndex][decision.cardIndex]
                const newColor = decision.namedColor || card.color!

                lobby.game = gamePlay(
                    (r: Round) => roundPlay(decision.cardIndex!, decision.namedColor, r),
                    lobby.game
                )

                this.broadcastToLobby(lobby.id, {
                    type: 'CARD_PLAYED',
                    payload: { playerIndex: botIndex, card, newColor }
                })

                // Check if bot should call UNO
                if (lobby.game.currentRound && shouldCallUno(lobby.game.currentRound, botIndex)) {
                    // Small delay then call UNO
                    setTimeout(() => {
                        this.executeBotSayUno(lobby, botIndex)
                    }, 200 + Math.random() * 500)
                }
            }

            this.broadcastGameState(lobby)
            this.checkRoundEnd(lobby)

            // Schedule next bot move if needed
            if (lobby.game?.currentRound) {
                this.scheduleBotMoveIfNeeded(lobby)
            }
        } catch (error: any) {
            console.error(`Bot ${bot.playerName} error:`, error.message)
        }
    }

    private executeBotSayUno(lobby: Lobby, botIndex: number): void {
        if (!lobby.game?.currentRound) return

        try {
            lobby.game = gamePlay((r: Round) => sayUno(botIndex, r), lobby.game)

            this.broadcastToLobby(lobby.id, {
                type: 'UNO_CALLED',
                payload: { playerIndex: botIndex }
            })

            this.broadcastGameState(lobby)
        } catch (error) {
            // Ignore - might already be called
        }
    }

    private executeBotCatchUno(lobby: Lobby, botIndex: number, accusedIndex: number): void {
        if (!lobby.game?.currentRound) return

        try {
            const oldRound = lobby.game.currentRound
            lobby.game = gamePlay(
                (r: Round) => catchUnoFailure({ accuser: botIndex, accused: accusedIndex }, r),
                lobby.game
            )

            if (lobby.game.currentRound &&
                lobby.game.currentRound.hands[accusedIndex].length >
                oldRound.hands[accusedIndex].length) {
                this.broadcastToLobby(lobby.id, {
                    type: 'UNO_CAUGHT',
                    payload: { accuser: botIndex, accused: accusedIndex }
                })
            }

            this.broadcastGameState(lobby)
        } catch (error) {
            // Ignore
        }
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

            // Schedule bot move if it's now a bot's turn
            this.scheduleBotMoveIfNeeded(lobby)
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

            // Schedule bot move if it's now a bot's turn
            this.scheduleBotMoveIfNeeded(lobby)
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
            isConnected: true,
            isBot: false
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
            maxPlayers: lobby.maxPlayers,
            isStarted: lobby.game !== null,
            botPlayers: lobby.botIndices
        }
    }

    private getGameStateForPlayer(lobby: Lobby, playerIndex: number): GameStateForPlayer {
        const game = lobby.game!
        const round = game.currentRound

        const players: PublicPlayerState[] = lobby.players.map((p, idx) => ({
            name: p.playerName,
            cardCount: round ? round.hands[idx].length : 0,
            isConnected: p.isConnected,
            isBot: p.isBot || false
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
