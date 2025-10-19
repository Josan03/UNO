import type { BotWorkerMessage } from '@/workers/bot-worker'

/**
 * Converts the RoundClass + bot index into plain JSON data
 * that can be safely sent to a Web Worker.
 */

export function serializeForBot(
  data: BotWorkerMessage['roundState'],
): BotWorkerMessage['roundState'] {
  const topCard = data.topCard
  const botHand = data.botHand
  return {
    currentColor: data.currentColor ?? undefined,
    topCard: topCard ? { ...topCard } : undefined,
    botHand: botHand.map((c) => ({ ...c })),
  }
}
