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
    botIndices: number[]
}

export class GameServer {
    private lobbies = new Map<string, Lobby>()
    private playerToLobby = new Map<string, string>()
    private playerConnections = new Map<string, PlayerConnection>()

    private messageSubject = new Subject<{ playerId: string; message: ClientMessage }>()
    private lobbyUpdateSubject = new Subject<{ lobbyId: string; lobby: Lobby }>()
    private gameEventSubject = new Subject<{ lobbyId: string; event: ServerMessage }>()

    constructor() {
        this.setupMessageHandlers()
    }

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
            lobby.players[playerIndex].isConnected = false
            this.broadcastToLobby(lobbyId, {
                type: 'PLAYER_DISCONNECTED',
                payload: { playerIndex, playerName: lobby.players[playerIndex].playerName }
            })
        } else {
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


        if (lobby.game) {
            player.send({
                type: 'GAME_STATE',
                payload: this.getGameStateForPlayer(lobby, playerIndex)
            })
        }

        return true
    }

    private setupMessageHandlers(): void {
        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'CREATE_LOBBY')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'CREATE_LOBBY') return
            this.handleCreateLobby(playerId, message.payload)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'JOIN_LOBBY')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'JOIN_LOBBY') return
            this.handleJoinLobby(playerId, message.payload)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'START_GAME')
        ).subscribe(({ playerId }) => {
            this.handleStartGame(playerId)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'PLAY_CARD')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'PLAY_CARD') return
            this.handlePlayCard(playerId, message.payload)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'DRAW_CARD')
        ).subscribe(({ playerId }) => {
            this.handleDrawCard(playerId)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'SAY_UNO')
        ).subscribe(({ playerId }) => {
            this.handleSayUno(playerId)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'CATCH_UNO')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'CATCH_UNO') return
            this.handleCatchUno(playerId, message.payload)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'RETURN_TO_LOBBY')
        ).subscribe(({ playerId }) => {
            this.handleReturnToLobby(playerId)
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'ADD_BOT')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'ADD_BOT') return
            this.handleAddBot(playerId, message.payload?.difficulty || 'hard')
        })

        this.messageSubject.pipe(
            filter(({ message }) => message.type === 'REMOVE_BOT')
        ).subscribe(({ playerId, message }) => {
            if (message.type !== 'REMOVE_BOT') return
            this.handleRemoveBot(playerId, message.payload.botIndex)
        })
    }

    private handleCreateLobby(playerId: string, payload: { playerName: string; maxPlayers: number }): void {
        const lobbyId = uuidv4().substring(0, 8).toUpperCase()

        const playerConnection = this.findOrCreatePlayer(playerId, payload.playerName)
        resetBotNames()

        const lobby: Lobby = {
            id: lobbyId,
            players: [playerConnection],
            hostIndex: 0,
            maxPlayers: Math.min(Math.max(payload.maxPlayers || 4, 2), 5),
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

        const playerNames = lobby.players.map(p => p.playerName)
        lobby.game = createGame({
            players: playerNames,
            targetScore: 1
        })

        lobby.players.forEach((player, idx) => {
            player.send({
                type: 'GAME_STARTED',
                payload: this.getGameStateForPlayer(lobby, idx)
            })
        })

        this.scheduleBotMoveIfNeeded(lobby)
    }

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

        const botId = `bot_${uuidv4().substring(0, 8)}`
        const botName = generateBotName()
        const botConnection: PlayerConnection = {
            id: botId,
            playerName: botName,
            send: () => { },
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

        this.playerToLobby.delete(player.id)
        lobby.players.splice(botIndex, 1)

        lobby.botIndices = lobby.players
            .map((p, idx) => p.isBot ? idx : -1)
            .filter(idx => idx >= 0)

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

        const delay = 800 + Math.random() * 1200
        setTimeout(() => {
            this.executeBotMove(lobby, round.playerInTurn!)
        }, delay)
    }

    private executeBotMove(lobby: Lobby, botIndex: number): void {
        if (!lobby.game?.currentRound) return

        const round = lobby.game.currentRound
        if (round.playerInTurn !== botIndex) return

        const bot = lobby.players[botIndex]
        if (!bot?.isBot) return

        try {
            const catchTarget = shouldCatchUno(round, botIndex)
            if (catchTarget !== null) {
                if (Math.random() < 0.7) {
                    this.executeBotCatchUno(lobby, botIndex, catchTarget)
                    setTimeout(() => {
                        this.executeBotMove(lobby, botIndex)
                    }, 500)
                    return
                }
            }

            const decision = makeBotDecision(round, botIndex, bot.botDifficulty || 'hard')

            if (decision.action === 'draw') {
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

                if (lobby.game.currentRound && shouldCallUno(lobby.game.currentRound, botIndex)) {
                }
            }

            this.broadcastGameState(lobby)
            this.checkRoundEnd(lobby)

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
        }
    }

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

            this.broadcastToLobby(lobby.id, {
                type: 'CARD_PLAYED',
                payload: { playerIndex, card, newColor }
            })

            this.broadcastGameState(lobby)
            this.checkRoundEnd(lobby)

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

    private findOrCreatePlayer(playerId: string, playerName: string): PlayerConnection {
        for (const [, lobby] of this.lobbies) {
            const existing = lobby.players.find(p => p.id === playerId)
            if (existing) {
                existing.playerName = playerName
                return existing
            }
        }

        const storedConnection = this.playerConnections.get(playerId)
        if (storedConnection) {
            storedConnection.playerName = playerName
            return storedConnection
        }

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

        lobby.game = null

        this.broadcastLobbyState(lobby.id)
    }
}
