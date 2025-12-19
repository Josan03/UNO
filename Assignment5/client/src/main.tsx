import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './index.css'

// Generate random UNO card favicon
function generateUnoFavicon() {
    const colors = [
        { bg: '#ef4444', name: 'red' },
        { bg: '#06b6d4', name: 'cyan' },
        { bg: '#10b981', name: 'emerald' },
        { bg: '#facc15', name: 'yellow' }
    ]
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', '⇄', '⊘']

    const color = colors[Math.floor(Math.random() * colors.length)]
    const number = numbers[Math.floor(Math.random() * numbers.length)]
    const textColor = color.name === 'yellow' ? '#000' : '#fff'

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect x="4" y="2" width="56" height="60" rx="6" fill="#0a0a0a" stroke="${color.bg}" stroke-width="3"/>
            <rect x="4" y="2" width="56" height="15" rx="6" fill="${color.bg}"/>
            <rect x="4" y="47" width="56" height="15" rx="6" fill="${color.bg}"/>
            <text x="32" y="40" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="${number.length > 1 ? '18' : '24'}" font-weight="900" fill="${color.bg}">${number}</text>
            <text x="12" y="14" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${textColor}">${number}</text>
        </svg>
    `

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
    link.type = 'image/svg+xml'
    link.rel = 'icon'
    link.href = url
    document.head.appendChild(link)
}

generateUnoFavicon()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>,
)
