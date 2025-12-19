import type { Metadata } from 'next'
import './globals.css'
import StoreProvider from '@/store/StoreProvider'

export const metadata: Metadata = {
  title: 'UNO - Multiplayer Game',
  description: 'Play UNO online with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}
