'use client'

import { useEffect } from 'react'

interface ToastProps {
    message: string
    type?: 'error' | 'success' | 'info'
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type = 'error', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [duration, onClose])

    const bgColor = {
        error: 'bg-red-500',
        success: 'bg-green-500',
        info: 'bg-blue-500'
    }[type]

    const icon = {
        error: '❌',
        success: '✅',
        info: 'ℹ️'
    }[type]

    return (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
            <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] backdrop-blur-sm bg-opacity-95`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-lg font-semibold flex-1">{message}</span>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors text-xl font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    )
}
