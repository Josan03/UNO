import type { Card, Color } from '@/model/card'
import { canPlayOn } from '@/utils/helpers'

export type BotWorkerMessage = {
  botIndex: number
  roundState: {
    topCard: Card | undefined
    currentColor?: Color | undefined
    botHand: Card[]
  }
}

type MoveTypePlay = {
  type: 'play'
  cardIndex: number
  color?: Color
}

type MoveTypeDraw = {
  type: 'draw'
}

export type BotWorkerResponse = {
  botIndex: number
  move: { type: 'play'; cardIndex: number; color?: Color } | { type: 'draw' }
}

// Listen for incoming data from the main thread
onmessage = function (event: MessageEvent<BotWorkerMessage>) {
  const { botIndex, roundState } = event.data
  const move = decideMove(roundState)
  console.log(move)
  postMessage({ botIndex, move } as BotWorkerResponse)
}

function decideMove({
  topCard,
  currentColor,
  botHand,
}: BotWorkerMessage['roundState']): BotWorkerResponse['move'] {
  // Find the first playable card using the same game logic
  const playableIndex = botHand.findIndex((card) => canPlayOn(card, topCard, currentColor))

  if (playableIndex !== -1) {
    const card = botHand[playableIndex]

    // 🧠 Only name a color for WILD or WILD_DRAW
    if (card.type === 'WILD' || card.type === 'WILD_DRAW') {
      const colors: Color[] = ['RED', 'YELLOW', 'GREEN', 'BLUE']
      const chosenColor = colors[Math.floor(Math.random() * colors.length)]
      return { type: 'play', cardIndex: playableIndex, color: chosenColor }
    }

    // Normal colored card → no color argument
    return { type: 'play', cardIndex: playableIndex }
  }

  return { type: 'draw' }
}
