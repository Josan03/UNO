# Assignment 6 Solution - UNO with Next.js SSR

## Overview

This project implements the classic UNO card game using Next.js with Server-Side Rendering (SSR), following the functional programming paradigm from Assignment 4. The implementation successfully combines the immutable game logic with Next.js's modern features to create a fully functional, production-ready web application.

## Architecture Decisions

### 1. Static vs Dynamic Pages

| Page | Type | Rationale |
|------|------|-----------|
| `/` (Home) | **Static** | Welcome screen with no dynamic data - pre-rendered at build time for optimal performance |
| `/lobby` | **Client Component** | Interactive form requiring user input and state management |
| `/game/[sessionId]` | **Dynamic (Client Component)** | Each game session is unique and requires real-time state updates |
| API Routes (`/api/*`) | **Server-side** | Handle game logic execution and session management on the server |

**Why this split?**
- The home page is purely presentational and can be cached
- The lobby needs client-side interactivity for form handling
- Game sessions are unique per user and require dynamic rendering
- API routes keep game logic secure and centralized on the server

### 2. Server vs Client Components

**Server Components:**
- Home page (`app/page.tsx`) - Static content delivery
- API route handlers - Game logic execution

**Client Components:**
- Lobby page - Form interactions and navigation
- Game page - Real-time game state management
- All UI components (UnoCard, PlayerHand, etc.) - Interactive card selection and animations

**Decision rationale:**
- Server components reduce JavaScript bundle size for static content
- Client components are used where interactivity is essential (card clicks, color selection)
- This approach optimizes initial page load while maintaining rich interactivity

### 3. Session Storage Strategy

**Implementation: In-Memory Map**

```typescript
const sessions = new Map<string, Round>()
```

**Why this approach?**
- **Simplicity**: Perfect for development and demonstration
- **Speed**: Instant access with O(1) lookup time
- **State preservation**: Maintains full game state including shuffler functions

**Limitations & Production Alternatives:**
- ⚠️ Data lost on server restart
- ⚠️ Not suitable for horizontal scaling

**Production recommendations:**
1. **Redis** - For fast, distributed caching
2. **PostgreSQL + Prisma** - For persistent storage with relational queries
3. **Upstash Redis** - Serverless option for Vercel deployments

## Functional Programming Approach

### Pure Functions from Assignment 4

The game logic is entirely functional and immutable:

```typescript
// All game state transformations are pure functions
export const play = (cardIndex: number, namedColor: Color | undefined, round: Round): Round
export const draw = (round: Round): Round
export const createRound = (players: string[], dealer: number, shuffler: Shuffler<Card>): Round
```

**Key principles maintained:**
- ✅ No mutations - all operations return new objects
- ✅ Predictable behavior - same inputs always produce same outputs
- ✅ Easy testing - functions can be tested in isolation
- ✅ Referential transparency - functions depend only on their inputs

### Immutability Strategy

```typescript
// Creating new objects instead of mutating
const newRound: Round = {
    ...round,
    hands: round.hands.map(hand => [...hand]),
    drawPile: [...round.drawPile],
    discardPile: [...round.discardPile],
    unoCalled: [...round.unoCalled]
}
```

**Benefits realized:**
- Time-travel debugging possible (could implement undo/redo)
- Safe concurrent operations
- Easier to reason about state changes
- No unexpected side effects

### Lodash Integration

Used for utility operations in deck creation:

```typescript
import * as _ from 'lodash'

// Functional array operations
const numberedDeck = colors.flatMap(createNumberedCards)
```

## API Design

### RESTful Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/api/game` | POST | Create new game | `{ players, cardsPerPlayer }` | `{ sessionId, round }` |
| `/api/play` | POST | Play a card | `{ sessionId, cardIndex, namedColor? }` | `{ round }` |
| `/api/draw` | POST | Draw a card | `{ sessionId }` | `{ round }` |
| `/api/state/[sessionId]` | GET | Fetch current state | - | `{ round }` |

**Design principles:**
- Stateless API (state stored server-side in session store)
- Consistent error handling with appropriate HTTP status codes
- JSON responses for easy client consumption
- Pure functional transformations applied to game state

## Component Architecture

### Component Hierarchy

```
GamePage (Client Component)
├── BotHand (Client Component) × 1-3 bots
├── DiscardPile (Client Component)
│   ├── UnoCard (draw pile)
│   ├── UnoCard (discard pile)
│   └── Color Indicator
└── PlayerHand (Client Component)
    ├── UnoCard × N cards
    └── Color Picker (conditional)
```

### State Management

**No Redux or external state management needed!**

Instead, we use:
1. **API as source of truth** - Server maintains authoritative game state
2. **Local React state** - UI-specific state (loading, selected card, etc.)
3. **Fetch-on-demand** - Client fetches state when needed

```typescript
const [roundState, setRoundState] = useState<RoundState | null>(null)

// Update state by fetching from API
const response = await fetch('/api/play', { /* ... */ })
const data = await response.json()
setRoundState(data.round)
```

**Why this works:**
- Server-side state is authoritative
- No synchronization issues
- Simple mental model
- No need for complex state management libraries

## Bot Implementation

### Simple AI Strategy

```typescript
// Find first playable card or draw
const playableIndex = botHand.findIndex(card => 
  card.type === 'WILD' ||
  card.color === currentColor ||
  (card.type === topCard.type && /* ... */)
)
```

**Bot behavior:**
1. Check for playable cards in hand
2. Play first valid card found
3. If no valid cards, draw from deck
4. For WILD cards, randomly select a color

**Future improvements:**
- Strategic color selection based on hand composition
- Preference for action cards
- Challenge WILD DRAW FOUR when appropriate

## Performance Optimizations

### 1. Static Generation
- Home page pre-rendered at build time
- Instant load with no server computation

### 2. Component Optimization
```typescript
// Conditional rendering to avoid unnecessary computations
{(playerCount === 2 || playerCount === 4) && (
  <BotHand /* ... */ />
)}
```

### 3. Efficient State Updates
- Only re-render components when their props change
- Minimal data sent in API responses (exclude internal state)

### 4. Image Optimization
- Tailwind for CSS-only card designs (no image assets)
- Reduces bundle size and improves load times

## Testing Coverage

### Unit Tests (from Assignment 4)

The functional game logic already has comprehensive test coverage:

```bash
cd /Users/dk8SevBa/workspace/uni/UNO/Assignment4
npm test
```

**Test categories:**
- ✅ Deck creation and shuffling
- ✅ Round initialization
- ✅ Card playing rules
- ✅ Special card effects (SKIP, REVERSE, DRAW, WILD)
- ✅ Game ending conditions
- ✅ Score calculation

### Integration Testing (Manual)

**Tested scenarios:**
1. ✅ Create game with 2-5 players
2. ✅ Play valid cards
3. ✅ Draw cards when no valid plays
4. ✅ Wild card color selection
5. ✅ Bot turn automation
6. ✅ Game ending and winner detection
7. ✅ Session persistence across page refreshes (within server lifetime)

### Production Build Test

```bash
npm run build    # ✅ Successful compilation
npm run start    # ✅ Production server starts correctly
```

## Known Limitations & Future Enhancements

### Current Limitations

1. **Session Persistence**
   - ⚠️ In-memory storage lost on server restart
   - ⚠️ No cross-device session sharing

2. **Multiplayer**
   - ⚠️ Currently single-player vs bots only
   - ⚠️ No real-time multiplayer with WebSockets

3. **Game Features**
   - ⚠️ No UNO call detection (from Assignment 4)
   - ⚠️ No penalty for forgetting to say UNO
   - ⚠️ No score tracking across multiple rounds

4. **UI/UX**
   - ⚠️ No animations for card movements
   - ⚠️ Basic responsive design (works but could be better)

### Future Enhancements

**High Priority:**
1. **Database Integration** - Replace in-memory storage with PostgreSQL + Prisma
2. **Real-time Multiplayer** - Add WebSocket support for live games
3. **Authentication** - User accounts and game history

**Medium Priority:**
4. **Advanced Bot AI** - Implement strategic decision-making
5. **Sound Effects** - Audio feedback for card plays
6. **Animation System** - Smooth card transitions and effects
7. **Mobile Optimization** - Better touch controls and layout

**Low Priority:**
8. **Leaderboards** - Global player rankings
9. **Custom Rules** - Allow house rules customization
10. **Themes** - Dark mode and alternative card designs

## Deployment Checklist

- [x] TypeScript compilation successful
- [x] `npm run build` completes without errors
- [x] `npm run start` runs in production mode
- [x] All API routes functional
- [x] Client components render correctly
- [x] Game logic verified through tests
- [x] Error handling implemented
- [x] Loading states for async operations
- [ ] Environment variables configured (not needed for current implementation)
- [ ] Database migrations (N/A - using in-memory storage)
- [x] No console errors in browser
- [ ] Lighthouse audit (not performed - optional)

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16.0.5 | SSR & API routes |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first styling |
| State | React Hooks | Local component state |
| Game Logic | Functional Programming | Pure functions from Assignment 4 |
| Utilities | Lodash | Array/object manipulation |
| Session Management | UUID | Unique session IDs |
| Storage | In-Memory Map | Development session storage |

## Running the Application

### Development Mode
```bash
cd uno-ssr
npm install
npm run dev
# Open http://localhost:3000
```

### Production Mode
```bash
npm run build
npm run start
# Open http://localhost:3000
```

### File Structure
```
uno-ssr/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── game/route.ts
│   │   │   ├── play/route.ts
│   │   │   ├── draw/route.ts
│   │   │   └── state/[sessionId]/route.ts
│   │   ├── game/[sessionId]/page.tsx
│   │   ├── lobby/page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── UnoCard.tsx
│   │   ├── PlayerHand.tsx
│   │   ├── BotHand.tsx
│   │   └── DiscardPile.tsx
│   └── lib/
│       ├── game/
│       │   ├── deck.ts
│       │   ├── round.ts
│       │   ├── uno.ts
│       │   └── random_utils.ts
│       └── session.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.ts
```

## Conclusion

This implementation successfully demonstrates:
- ✅ Next.js SSR with App Router
- ✅ Functional programming paradigm maintained from Assignment 4
- ✅ Clean separation of server and client concerns
- ✅ Type-safe TypeScript throughout
- ✅ Production-ready build process
- ✅ Scalable architecture (with database upgrade path)

The project achieves all **MUST HAVE** requirements and several **SHOULD HAVE** features from the instructions. The functional approach from Assignment 4 integrates seamlessly with Next.js, proving that pure functional programming and modern SSR frameworks work excellently together.

**Key Achievement:** Built a complete, playable UNO game using Next.js SSR while maintaining the functional programming principles from Assignment 4! 🎉
