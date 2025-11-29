'use client'

import { createContext, useReducer, Dispatch } from 'react'
import { Toaster } from 'react-hot-toast'
import { rootReducer, initialAppState, AppState, AppAction } from '@/store/store'

export const AppStateContext = createContext<AppState | null>(null)
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null)

export function Providers({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(rootReducer, initialAppState)

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
                <Toaster position="top-center" />
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    )
}

