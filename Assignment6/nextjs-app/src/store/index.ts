'use client'

import { configureStore, Dispatch, UnknownAction } from '@reduxjs/toolkit'
import gameReducer from './gameSlice'
import { createWebSocketMiddleware, WSAction } from './websocketMiddleware'

export const makeStore = () => {
    return configureStore({
        reducer: {
            game: gameReducer
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(createWebSocketMiddleware())
    })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = Dispatch<UnknownAction | WSAction>
