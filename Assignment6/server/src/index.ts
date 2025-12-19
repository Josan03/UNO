import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { GameServer } from './gameServer'
import { ClientMessage, ServerMessage } from '../../shared/protocol'

const PORT = process.env.PORT || 3001

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

const gameServer = new GameServer()

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

wss.on('connection', (ws: WebSocket) => {
    const playerId = uuidv4()
    console.log(`Player connected: ${playerId}`)

    const send = (message: ServerMessage) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message))
        }
    }

    ws.on('message', (data: Buffer) => {
        try {
            const message: ClientMessage = JSON.parse(data.toString())
            console.log(`Received from ${playerId}:`, message.type)

            if (message.type === 'CREATE_LOBBY' || message.type === 'JOIN_LOBBY') {
                const playerName = message.payload.playerName
                gameServer.addPlayer(playerId, playerName, send)
            }

            gameServer.handleMessage(playerId, message)
        } catch (error) {
            console.error('Failed to parse message:', error)
            send({ type: 'ERROR', payload: { message: 'Invalid message format' } })
        }
    })

    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`)
        gameServer.removePlayer(playerId)
    })

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${playerId}:`, error)
    })
})

server.listen(PORT, () => {
    console.log(`🎮 UNO Server running on port ${PORT}`)
    console.log(`   WebSocket: ws://localhost:${PORT}`)
})
