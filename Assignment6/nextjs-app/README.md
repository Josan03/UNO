# UNO - Next.js Multiplayer Game

A multiplayer UNO card game built with Next.js, React, Redux Toolkit, and WebSockets.

## Project Structure

This is a Next.js conversion of the original Vite + React application. The project consists of:

-  **nextjs-app/** - Next.js frontend application (this directory)
-  **server/** - WebSocket game server (unchanged, run separately)
-  **shared/** - Shared types and game logic

## Prerequisites

-  Node.js 18+
-  npm or yarn

## Installation

1. Install dependencies for the Next.js app:

```bash
cd nextjs-app
npm install
```

2. Install dependencies for the server (in a separate terminal):

```bash
cd ../server
npm install
```

## Running the Application

### Development Mode

1. Start the WebSocket server (in the `server` directory):

```bash
cd server
npm run dev
```

The server will run on `http://localhost:3001`

2. Start the Next.js development server (in the `nextjs-app` directory):

```bash
cd nextjs-app
npm run dev
```

The app will run on `http://localhost:3000`

3. Open your browser and navigate to `http://localhost:3000`

### Production Build

1. Build the Next.js app:

```bash
cd nextjs-app
npm run build
npm start
```

2. Build and run the server:

```bash
cd server
npm run build
npm start
```

## Key Changes from Vite Version

### Architecture

-  **App Router**: Uses Next.js 14 App Router instead of Vite
-  **Client Components**: All interactive components use `'use client'` directive
-  **Redux Integration**: Store provider wraps the app in the root layout
-  **WebSockets**: Client-side only (runs in browser, not during SSR)

### File Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with Redux provider
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── GameApp.tsx       # Main game router component
│   │   ├── Home.tsx          # Home/connect screen
│   │   ├── Lobby.tsx         # Lobby screen
│   │   ├── Game.tsx          # Game screen
│   │   ├── UnoCard.tsx       # Card component
│   │   ├── ColorPicker.tsx   # Color selection modal
│   │   ├── GameHistory.tsx   # Game history sidebar
│   │   └── GameResults.tsx   # End game modal
│   └── store/
│       ├── index.ts          # Store configuration
│       ├── hooks.ts          # Typed Redux hooks
│       ├── StoreProvider.tsx # Client-side store provider
│       ├── gameSlice.ts      # Game state slice
│       └── websocketMiddleware.ts  # WebSocket middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Path Aliases

-  `@/` points to `src/`
-  `@shared/` points to `../shared/`

## Features

-  🎮 Multiplayer UNO gameplay with 2-5 players
-  🤖 AI bot opponents with 3 difficulty levels
-  🎨 Beautiful card animations and effects
-  📱 Responsive design
-  🔄 Real-time game state synchronization
-  📜 Game history tracking
-  🏆 Winner celebration screen

## Technology Stack

-  **Frontend**: Next.js 14, React 18, TypeScript
-  **State Management**: Redux Toolkit with WebSocket middleware
-  **Styling**: Tailwind CSS
-  **WebSockets**: RxJS WebSocket integration
-  **Server**: Express + ws (WebSocket server)

## Game Controls

-  **Create Game**: Host a new game with 2-5 players
-  **Join Game**: Enter a room code to join existing game
-  **Add Bots**: Host can add AI players (Easy/Medium/Hard)
-  **Play Card**: Click on playable cards in your hand
-  **Draw Card**: Click the draw pile when you can't play
-  **Call UNO**: Click UNO button when you have 1-2 cards
-  **Catch UNO**: Catch opponents who forget to call UNO

## Development Notes

-  The WebSocket server must be running for the game to work
-  The server runs on port 3001 by default
-  The Next.js app runs on port 3000 by default
-  All components that use Redux or browser APIs are marked with `'use client'`
-  The shared game logic is imported from the parent `shared/` directory

## Troubleshooting

### WebSocket Connection Issues

-  Ensure the server is running on port 3001
-  Check browser console for connection errors
-  Verify firewall settings allow WebSocket connections

### Build Errors

-  Run `npm install` in both `nextjs-app` and `server` directories
-  Ensure Node.js version is 18 or higher
-  Clear `.next` folder and rebuild if needed: `rm -rf .next && npm run build`

## License

MIT
