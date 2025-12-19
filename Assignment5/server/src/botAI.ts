import { Round, canPlay, canPlayAny, topOfDiscard } from '../../shared/model/round'
import { Card, Color } from '../../shared/model/deck'

export type BotDifficulty = 'easy' | 'medium' | 'hard'

interface BotDecision {
    action: 'play' | 'draw'
    cardIndex?: number
    namedColor?: Color
}

interface CardScore {
    index: number
    card: Card
    score: number
}

// ============================================
// Smart Bot AI
// ============================================

export function makeBotDecision(
    round: Round,
    playerIndex: number,
    difficulty: BotDifficulty = 'hard'
): BotDecision {
    if (round.playerInTurn !== playerIndex) {
        throw new Error('Not bot\'s turn')
    }

    const hand = round.hands[playerIndex]
    const playableCards = getPlayableCards(round, playerIndex)

    // No playable cards - must draw
    if (playableCards.length === 0) {
        return { action: 'draw' }
    }

    // Easy: Random playable card
    if (difficulty === 'easy') {
        const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)]
        const namedColor = getOptimalColor(hand, randomCard.card.type === 'WILD' || randomCard.card.type === 'WILD DRAW')
        return {
            action: 'play',
            cardIndex: randomCard.index,
            namedColor: randomCard.card.type === 'WILD' || randomCard.card.type === 'WILD DRAW' ? namedColor : undefined
        }
    }

    // Medium/Hard: Score each card and pick the best
    const scoredCards = playableCards.map(pc => ({
        ...pc,
        score: scoreCard(pc.card, hand, round, playerIndex, difficulty)
    }))

    // Sort by score (higher is better)
    scoredCards.sort((a, b) => b.score - a.score)

    const bestCard = scoredCards[0]
    const namedColor = getOptimalColor(hand, bestCard.card.type === 'WILD' || bestCard.card.type === 'WILD DRAW')

    return {
        action: 'play',
        cardIndex: bestCard.index,
        namedColor: bestCard.card.type === 'WILD' || bestCard.card.type === 'WILD DRAW' ? namedColor : undefined
    }
}

// ============================================
// Helper Functions
// ============================================

function getPlayableCards(round: Round, playerIndex: number): { index: number; card: Card }[] {
    const hand = round.hands[playerIndex]
    const playable: { index: number; card: Card }[] = []

    // Temporarily set playerInTurn to check canPlay
    const checkRound = { ...round, playerInTurn: playerIndex }

    for (let i = 0; i < hand.length; i++) {
        if (canPlay(i, checkRound)) {
            playable.push({ index: i, card: hand[i] })
        }
    }

    return playable
}

function scoreCard(
    card: Card,
    hand: Card[],
    round: Round,
    playerIndex: number,
    difficulty: BotDifficulty
): number {
    let score = 0
    const nextPlayerIndex = getNextPlayerIndex(round, playerIndex)
    const nextPlayerHandSize = round.hands[nextPlayerIndex].length

    // ============================================
    // Strategic scoring based on game situation
    // ============================================

    // Priority 1: If next player has few cards, prioritize attack cards
    if (nextPlayerHandSize <= 2) {
        if (card.type === 'DRAW') score += 50
        if (card.type === 'WILD DRAW') score += 60
        if (card.type === 'SKIP') score += 40
        if (card.type === 'REVERSE' && round.playerCount > 2) score += 30
    }

    // Priority 2: Action card values
    switch (card.type) {
        case 'WILD DRAW':
            // Save wild draw for when needed, unless next player is close to winning
            score += nextPlayerHandSize <= 2 ? 50 : -10
            break
        case 'WILD':
            // Save wilds for color changes, slight penalty for using early
            score += hand.length <= 3 ? 30 : -5
            break
        case 'DRAW':
            score += 25 // Good offensive card
            break
        case 'SKIP':
            score += 20 // Good control
            break
        case 'REVERSE':
            score += round.playerCount > 2 ? 15 : 20 // More valuable in 2-player
            break
        case 'NUMBERED':
            // Prefer playing high-value numbered cards first
            score += card.number! * 2
            break
    }

    // Priority 3: Color strategy - prefer to keep color diversity
    const colorCounts = countColors(hand)
    if (card.color) {
        const colorCount = colorCounts[card.color] || 0
        // If we have many of this color, prefer to play it
        score += colorCount * 3
    }

    // Priority 4: Match current color (safe play)
    if (card.color === round.currentColor) {
        score += 10
    }

    // Priority 5: Hard mode - consider opponents' hands
    if (difficulty === 'hard') {
        // If we're close to UNO, prioritize getting there
        if (hand.length === 2) {
            score += 20 // Any playable card is great
        }

        // Avoid leaving ourselves with only wilds
        const nonWilds = hand.filter(c => c.type !== 'WILD' && c.type !== 'WILD DRAW')
        if (nonWilds.length === 1 && (card.type === 'WILD' || card.type === 'WILD DRAW')) {
            score -= 30 // Don't waste our last non-wild
        }

        // Consider blocking the previous player if they're close to winning
        const prevPlayerIndex = getPrevPlayerIndex(round, playerIndex)
        const prevPlayerHandSize = round.hands[prevPlayerIndex].length
        if (prevPlayerHandSize <= 2 && card.type === 'REVERSE' && round.playerCount > 2) {
            score += 25 // Good to skip back to them with a reverse
        }
    }

    // Add small random factor to avoid predictable play
    score += Math.random() * 5

    return score
}

function getOptimalColor(hand: Card[], isWild: boolean): Color {
    if (!isWild) return 'RED' // Shouldn't be called, but default

    const colorCounts = countColors(hand)

    // Find the color we have most of
    let bestColor: Color = 'RED'
    let maxCount = 0

    const colors: Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW']
    for (const color of colors) {
        const count = colorCounts[color] || 0
        if (count > maxCount) {
            maxCount = count
            bestColor = color
        }
    }

    // If we have no colored cards, pick randomly
    if (maxCount === 0) {
        return colors[Math.floor(Math.random() * colors.length)]
    }

    return bestColor
}

function countColors(hand: Card[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const card of hand) {
        if (card.color) {
            counts[card.color] = (counts[card.color] || 0) + 1
        }
    }
    return counts
}

function getNextPlayerIndex(round: Round, currentPlayer: number): number {
    const direction = round.currentDirection === 'clockwise' ? 1 : -1
    return (currentPlayer + direction + round.playerCount) % round.playerCount
}

function getPrevPlayerIndex(round: Round, currentPlayer: number): number {
    const direction = round.currentDirection === 'clockwise' ? -1 : 1
    return (currentPlayer + direction + round.playerCount) % round.playerCount
}

// ============================================
// Bot should call UNO
// ============================================

export function shouldCallUno(round: Round, playerIndex: number): boolean {
    const hand = round.hands[playerIndex]
    // Call UNO when we have 1 card and haven't called yet
    return hand.length === 1 && !round.unoCalled[playerIndex]
}

// ============================================
// Bot should catch UNO failure
// ============================================

export function shouldCatchUno(round: Round, playerIndex: number): number | null {
    // Check all other players
    for (let i = 0; i < round.playerCount; i++) {
        if (i === playerIndex) continue

        const hand = round.hands[i]
        const hasCalledUno = round.unoCalled[i]

        // If player has 1 card and hasn't called UNO, catch them!
        if (hand.length === 1 && !hasCalledUno && round.unoFailureCandidate === i) {
            return i
        }
    }

    return null
}

// ============================================
// Bot names
// ============================================

const BOT_NAMES = [
    'Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta',
    'Bot Epsilon', 'Bot Zeta', 'Bot Eta', 'Bot Theta',
    'UnoMaster', 'CardShark', 'WildBot', 'SkipperBot',
    'ReverseBot', 'DrawBot', 'SpeedyBot', 'CleverBot'
]

let botNameIndex = 0

export function generateBotName(): string {
    const name = BOT_NAMES[botNameIndex % BOT_NAMES.length]
    botNameIndex++
    return name
}

export function resetBotNames(): void {
    botNameIndex = 0
}
