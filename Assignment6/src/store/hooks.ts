import { useContext } from 'react'
import { AppStateContext, AppDispatchContext } from '@/components/Providers'

export function useAppState() {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error('useAppState must be used within AppProvider')
    }
    return context
}

export function useAppDispatch() {
    const context = useContext(AppDispatchContext)
    if (!context) {
        throw new Error('useAppDispatch must be used within AppProvider')
    }
    return context
}

