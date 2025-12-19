# UNO Multiplayer Game

A real-time multiplayer UNO card game built with:

- **Server**: Node.js + WebSocket + RxJS
- **Client**: React + Redux + RxJS
- **Shared**: TypeScript domain model from Assignment4

## Architecture

```
Assignment5/
├── shared/           # Shared code between client and server
│   ├── model/        # UNO game domain model (from Assignment4)
│   │   ├── deck.ts   # Card, Deck types and createInitialDeck()
│   │   ├── round.ts  # Round state and actions (play, draw, sayUno, etc.)
│   │   └── uno.ts    # Game state and multi-round logic
│   ├── utils/        # Utility functions
│   │   └── random_utils.ts
│   └── protocol.ts   # WebSocket message types (ClientMessage, ServerMessage)
│
├── server/           # Node.js WebSocket server
│   └── src/
│       ├── index.ts       # Express + WebSocket server setup
│       └── gameServer.ts  # Game logic, lobbies, RxJS event streams
│
└── client/           # React SPA
    └── src/
        ├── App.tsx
        ├── store/
        │   ├── index.ts              # Redux store configuration
        │   ├── gameSlice.ts          # Game state slice
        │   └── websocketMiddleware.ts # RxJS WebSocket middleware
        └── components/
            ├── Home.tsx        # Join/Create lobby screen
            ├── Lobby.tsx       # Pre-game lobby
            ├── Game.tsx        # Main game UI
            ├── GameOver.tsx    # End game screen
            ├── UnoCard.tsx     # Card component
            └── ColorPicker.tsx # Wild card color selection
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

Run both server and client in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server (port 3001)
npm run dev:server

# Terminal 2 - Client (port 3000)
npm run dev:client
```

### Playing the Game

1. Open `http://localhost:3000` in your browser
2. Enter your name and create a new game or join with a lobby code
3. Share the lobby code with friends
4. Host starts the game when at least 2 players have joined
5. Play UNO!

## Game Features

- **Real-time multiplayer**: WebSocket-based communication
- **Full UNO rules**: All card types (numbered, skip, reverse, draw 2, wild, wild draw 4)
- **UNO call system**: Call UNO when you have 1 card, catch others who forget
- **Score tracking**: Play to target score (default 500 points)
- **Reconnection support**: Rejoin if disconnected

## Tech Stack

| Component | Technology |
|-----------|------------|
| Server Runtime | Node.js |
| WebSocket | ws |
| Server Event Streams | RxJS |
| Client Framework | React 18 |
| State Management | Redux Toolkit |
| Client WebSocket | RxJS webSocket |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Language | TypeScript |

## WebSocket Protocol

### Client → Server

| Message | Description |
|---------|-------------|
| `CREATE_LOBBY` | Create a new game lobby |
| `JOIN_LOBBY` | Join an existing lobby |
| `START_GAME` | Host starts the game |
| `PLAY_CARD` | Play a card from hand |
| `DRAW_CARD` | Draw a card from deck |
| `SAY_UNO` | Call "UNO!" |
| `CATCH_UNO` | Catch a player who didn't say UNO |

### Server → Client

| Message | Description |
|---------|-------------|
| `LOBBY_JOINED` | Lobby join confirmed |
| `LOBBY_UPDATED` | Lobby state changed |
| `GAME_STARTED` | Game has begun |
| `GAME_STATE` | Full game state update |
| `CARD_PLAYED` | A player played a card |
| `CARD_DRAWN` | A player drew a card |
| `UNO_CALLED` | A player called UNO |
| `UNO_CAUGHT` | A player was caught |
| `GAME_ENDED` | Game is over |
| `ERROR` | Error message |
