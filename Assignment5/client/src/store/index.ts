import { configureStore, Dispatch, UnknownAction } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import gameReducer from './gameSlice'
import { createWebSocketMiddleware, WSAction } from './websocketMiddleware'

export const store = configureStore({
    reducer: {
        game: gameReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(createWebSocketMiddleware())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = Dispatch<UnknownAction | WSAction>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
