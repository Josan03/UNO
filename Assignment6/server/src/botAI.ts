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

    if (playableCards.length === 0) {
        return { action: 'draw' }
    }

    if (difficulty === 'easy') {
        const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)]
        const namedColor = getOptimalColor(hand, randomCard.card.type === 'WILD' || randomCard.card.type === 'WILD DRAW')
        return {
            action: 'play',
            cardIndex: randomCard.index,
            namedColor: randomCard.card.type === 'WILD' || randomCard.card.type === 'WILD DRAW' ? namedColor : undefined
        }
    }

    const scoredCards = playableCards.map(pc => ({
        ...pc,
        score: scoreCard(pc.card, hand, round, playerIndex, difficulty)
    }))

    scoredCards.sort((a, b) => b.score - a.score)

    const bestCard = scoredCards[0]
    const namedColor = getOptimalColor(hand, bestCard.card.type === 'WILD' || bestCard.card.type === 'WILD DRAW')

    return {
        action: 'play',
        cardIndex: bestCard.index,
        namedColor: bestCard.card.type === 'WILD' || bestCard.card.type === 'WILD DRAW' ? namedColor : undefined
    }
}

function getPlayableCards(round: Round, playerIndex: number): { index: number; card: Card }[] {
    const hand = round.hands[playerIndex]
    const playable: { index: number; card: Card }[] = []

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

    // attack if next player is close to winning
    if (nextPlayerHandSize <= 2) {
        if (card.type === 'DRAW') score += 50
        if (card.type === 'WILD DRAW') score += 60
        if (card.type === 'SKIP') score += 40
        if (card.type === 'REVERSE' && round.playerCount > 2) score += 30
    }

    switch (card.type) {
        case 'WILD DRAW':
            score += nextPlayerHandSize <= 2 ? 50 : -10
            break
        case 'WILD':
            score += hand.length <= 3 ? 30 : -5
            break
        case 'DRAW':
            score += 25
            break
        case 'SKIP':
            score += 20
            break
        case 'REVERSE':
            score += round.playerCount > 2 ? 15 : 20
            break
        case 'NUMBERED':
            score += card.number! * 2
            break
    }

    const colorCounts = countColors(hand)
    if (card.color) {
        const colorCount = colorCounts[card.color] || 0
        score += colorCount * 3
    }

    if (card.color === round.currentColor) {
        score += 10
    }

    if (difficulty === 'hard') {
        if (hand.length === 2) {
            score += 20
        }

        const nonWilds = hand.filter(c => c.type !== 'WILD' && c.type !== 'WILD DRAW')
        if (nonWilds.length === 1 && (card.type === 'WILD' || card.type === 'WILD DRAW')) {
            score -= 30
        }

        const prevPlayerIndex = getPrevPlayerIndex(round, playerIndex)
        const prevPlayerHandSize = round.hands[prevPlayerIndex].length
        if (prevPlayerHandSize <= 2 && card.type === 'REVERSE' && round.playerCount > 2) {
            score += 25
        }
    }

    score += Math.random() * 5

    return score
}

function getOptimalColor(hand: Card[], isWild: boolean): Color {
    if (!isWild) return 'RED'

    const colorCounts = countColors(hand)

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

export function shouldCallUno(round: Round, playerIndex: number): boolean {
    const hand = round.hands[playerIndex]
    return hand.length === 1 && !round.unoCalled[playerIndex]
}

export function shouldCatchUno(round: Round, playerIndex: number): number | null {
    for (let i = 0; i < round.playerCount; i++) {
        if (i === playerIndex) continue

        const hand = round.hands[i]
        const hasCalledUno = round.unoCalled[i]

        if (hand.length === 1 && !hasCalledUno && round.unoFailureCandidate === i) {
            return i
        }
    }

    return null
}

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
