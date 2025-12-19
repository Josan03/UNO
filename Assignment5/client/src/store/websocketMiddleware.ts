import { Middleware } from '@reduxjs/toolkit'
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'
import { timer } from 'rxjs'
import { retryWhen, delayWhen, tap } from 'rxjs/operators'
import { ClientMessage, ServerMessage } from '@shared/protocol'
import { setConnectionStatus, handleServerMessage } from './gameSlice'

// Action types for WebSocket operations
export const WS_CONNECT = 'WS_CONNECT'
export const WS_DISCONNECT = 'WS_DISCONNECT'
export const WS_SEND = 'WS_SEND'

export interface WSConnectAction {
    type: typeof WS_CONNECT
    payload: { url: string }
}

export interface WSDisconnectAction {
    type: typeof WS_DISCONNECT
}

export interface WSSendAction {
    type: typeof WS_SEND
    payload: ClientMessage
}

export type WSAction = WSConnectAction | WSDisconnectAction | WSSendAction

// Action creators
export const wsConnect = (url: string): WSConnectAction => ({
    type: WS_CONNECT,
    payload: { url }
})

export const wsDisconnect = (): WSDisconnectAction => ({
    type: WS_DISCONNECT
})

export const wsSend = (message: ClientMessage): WSSendAction => ({
    type: WS_SEND,
    payload: message
})

// WebSocket middleware
export const createWebSocketMiddleware = (): Middleware => {
    let socket$: WebSocketSubject<ServerMessage> | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let messageQueue: ClientMessage[] = []
    let isConnected = false

    return (store) => (next) => (action: unknown) => {
        const act = action as { type: string; payload?: unknown }

        switch (act.type) {
            case WS_CONNECT: {
                const { url } = (action as WSConnectAction).payload

                if (socket$) {
                    socket$.complete()
                }

                isConnected = false
                store.dispatch(setConnectionStatus('connecting'))

                socket$ = webSocket<ServerMessage>({
                    url,
                    openObserver: {
                        next: () => {
                            console.log('WebSocket connected')
                            isConnected = true
                            store.dispatch(setConnectionStatus('connected'))
                            reconnectAttempts = 0

                            // Send queued messages
                            while (messageQueue.length > 0 && socket$) {
                                const msg = messageQueue.shift()!
                                console.log('Sending queued:', msg.type)
                                socket$.next(msg as unknown as ServerMessage)
                            }
                        }
                    },
                    closeObserver: {
                        next: (event) => {
                            console.log('WebSocket closed', event)
                            isConnected = false
                            store.dispatch(setConnectionStatus('disconnected'))
                        }
                    }
                })

                socket$.pipe(
                    retryWhen(errors =>
                        errors.pipe(
                            tap(err => {
                                console.log('WebSocket error:', err)
                                reconnectAttempts++
                                if (reconnectAttempts > maxReconnectAttempts) {
                                    throw err
                                }
                            }),
                            delayWhen(() => timer(Math.min(1000 * reconnectAttempts, 5000)))
                        )
                    )
                ).subscribe({
                    next: (message: ServerMessage) => {
                        console.log('Received:', message.type)
                        store.dispatch(handleServerMessage(message))
                    },
                    error: (err) => {
                        console.error('WebSocket error:', err)
                        store.dispatch(setConnectionStatus('disconnected'))
                    }
                })

                break
            }

            case WS_DISCONNECT: {
                if (socket$) {
                    socket$.complete()
                    socket$ = null
                }
                store.dispatch(setConnectionStatus('disconnected'))
                break
            }

            case WS_SEND: {
                const message = (action as WSSendAction).payload
                if (socket$ && isConnected) {
                    console.log('Sending:', message.type)
                    socket$.next(message as unknown as ServerMessage)
                } else if (socket$) {
                    // Queue message to send when connected
                    console.log('Queuing:', message.type)
                    messageQueue.push(message)
                } else {
                    console.warn('Cannot send message: WebSocket not connected')
                }
                break
            }
        }

        return next(action)
    }
}
