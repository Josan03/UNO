import * as _ from "lodash/fp";
import { Card, Color, createInitialDeck, Deck } from "./deck";
import { Shuffler, standardShuffler } from "../utils/random_utils";

export type Direction = "clockwise" | "counterclockwise";

// Helper function to clone a round without mutating the original
const cloneRound = (round: Round): Round => ({
  ...round,
  hands: round.hands.map((hand) => [...hand]),
  drawPile: [...round.drawPile],
  discardPile: [...round.discardPile],
  unoCalled: [...round.unoCalled],
});

export interface Round {
  players: string[];
  dealer: number;
  playerCount: number;
  hands: Card[][];
  drawPile: Deck;
  discardPile: Deck;
  playerInTurn: number | undefined;
  currentColor: Color;
  currentDirection: Direction;
  shuffler: (deck: Deck) => Deck;
  unoCalled: boolean[];
  unoFailureChecked: boolean;
  unoFailureCandidate: number | undefined;
}

export const canPlay = (cardIndex: number, round: Round): boolean => {
  if (round.playerInTurn === undefined) return false;

  if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length)
    return false;

  const cardToPlay = round.hands[round.playerInTurn][cardIndex];
  const topCard = topOfDiscard(round);
  const currentColor = round.currentColor;

  if (cardToPlay.type === "WILD DRAW") {
    if (topCard.type === "DRAW") return true;

    const hasMatchingColorCard = round.hands[round.playerInTurn].some(
      (card: Card) => card.color === currentColor && card.type !== "DRAW"
    );
    if (hasMatchingColorCard) return false;
  }

  if (cardToPlay.type === "WILD" || cardToPlay.type === "WILD DRAW")
    return true;

  if (cardToPlay.type === "NUMBERED" && topCard.type === "NUMBERED")
    return (
      cardToPlay.color === topCard.color || cardToPlay.number === topCard.number
    );

  if (cardToPlay.type === "NUMBERED" && topCard.type !== "NUMBERED")
    return cardToPlay.color === currentColor;

  if (cardToPlay.type === topCard.type) return true;

  return cardToPlay.color === currentColor;
};

export const canPlayAny = (round: Round): boolean => {
  if (round.playerInTurn === undefined) return false;

  return round.hands[round.playerInTurn].some((_: Card, index: number) =>
    canPlay(index, round)
  );
};

export const topOfDiscard = (round: Round): Card => round.discardPile[0];

export const updatePlayerTurn = (round: Round): void => {
  if (round.playerInTurn === undefined) return;

  const nextPlayer =
    (round.playerInTurn +
      (round.currentDirection === "clockwise" ? 1 : -1) +
      round.players.length) %
    round.players.length;
  round.playerInTurn = nextPlayer;
};

export const draw = (round: Round): Round => {
  if (round.playerInTurn === undefined)
    throw new Error("Error: game has ended");

  const newRound = cloneRound(round);
  const currentPlayer = newRound.playerInTurn;
  const drawnCard = newRound.drawPile.shift();
  if (drawnCard) {
    newRound.hands[newRound.playerInTurn!].push(drawnCard);
  }

  if (newRound.drawPile.length === 0) replenishDrawPile(newRound);
  if (!canPlayAny(newRound)) updatePlayerTurn(newRound);

  if (
    newRound.unoFailureCandidate !== undefined &&
    newRound.unoFailureCandidate !== currentPlayer
  ) {
    newRound.unoFailureCandidate = undefined;
  }

  if (currentPlayer !== undefined) {
    for (let i = 0; i < newRound.unoCalled.length; i++) {
      if (i !== currentPlayer) {
        newRound.unoCalled[i] = false;
      }
    }
  }

  return newRound;
};

export const drawMultiple = (
  round: Round,
  count: number,
  playerIndex: number
): Round => {
  for (let i = 0; i < count; i++) {
    const drawnCard = round.drawPile.shift();
    if (drawnCard) {
      round.hands[playerIndex].push(drawnCard);
    }

    if (round.drawPile.length === 0) replenishDrawPile(round);
  }

  return round;
};

export const replenishDrawPile = (round: Round): void => {
  const topCard = round.discardPile[0];
  const remainingCards = round.discardPile.slice(1);
  round.drawPile = round.shuffler(remainingCards);
  round.discardPile = [topCard];
};

export const play = (
  cardIndex: number,
  namedColor: Color | undefined,
  round: Round
): Round => {
  if (round.playerInTurn === undefined)
    throw new Error("Error: game has ended");

  if (cardIndex < 0 || cardIndex >= round.hands[round.playerInTurn].length)
    throw new Error(`Error: invalid card index, out of bounds`);

  const cardToPlay = round.hands[round.playerInTurn][cardIndex];

  if (cardToPlay.type === "WILD" || cardToPlay.type === "WILD DRAW") {
    if (!namedColor) throw new Error("Error: must specify color for wild card");
  } else if (!canPlay(cardIndex, round)) {
    throw new Error(`Error: illegal play`);
  } else if (canPlay(cardIndex, round) && namedColor)
    throw new Error(`Error: illegal changing color`);

  const newRound = cloneRound(round);
  newRound.hands[newRound.playerInTurn!].splice(cardIndex, 1);
  newRound.discardPile.unshift(cardToPlay);

  newRound.unoFailureChecked = false;

  const playerWhoPlayed = newRound.playerInTurn;

  if (
    newRound.unoFailureCandidate !== undefined &&
    newRound.unoFailureCandidate !== playerWhoPlayed
  ) {
    newRound.unoFailureCandidate = undefined;
  }

  if (playerWhoPlayed !== undefined) {
    for (let i = 0; i < newRound.unoCalled.length; i++) {
      if (i !== playerWhoPlayed) {
        newRound.unoCalled[i] = false;
      }
    }
  }

  if (
    playerWhoPlayed !== undefined &&
    newRound.hands[playerWhoPlayed].length === 1
  ) {
    newRound.unoFailureCandidate = playerWhoPlayed;
  }

  switch (cardToPlay.type) {
    case "REVERSE":
      if (newRound.playerCount === 2) {
        updatePlayerTurn(newRound); // Reverse works as skip for 2 players
      }
      newRound.currentDirection =
        newRound.currentDirection === "clockwise"
          ? "counterclockwise"
          : "clockwise";
      updatePlayerTurn(newRound);
      break;
    case "SKIP":
      updatePlayerTurn(newRound);
      updatePlayerTurn(newRound); // Skip the next player
      break;
    case "DRAW":
      updatePlayerTurn(newRound); // Move to the next player
      const drawPlayer1 = newRound.playerInTurn;
      if (drawPlayer1 !== undefined) {
        drawMultiple(newRound, 2, drawPlayer1); // Draw 2 cards for the next player
      }
      updatePlayerTurn(newRound); // Skip the player which has drawn 2 cards
      break;
    case "WILD DRAW":
      newRound.currentColor = namedColor!;
      updatePlayerTurn(newRound); // Move to the next player
      const drawPlayer2 = newRound.playerInTurn;
      if (drawPlayer2 !== undefined) {
        drawMultiple(newRound, 4, drawPlayer2); // Draw 4 cards for the next player
      }
      updatePlayerTurn(newRound); // Skip the player which has drawn 4 cards
      break;
    case "WILD":
      newRound.currentColor = namedColor!;
      updatePlayerTurn(newRound);
      break;
    default:
      newRound.currentColor = cardToPlay.color!;
      updatePlayerTurn(newRound);
  }

  if (
    playerWhoPlayed !== undefined &&
    newRound.hands[playerWhoPlayed].length === 0
  ) {
    newRound.playerInTurn = undefined;
    return newRound;
  }

  return newRound;
};

export const sayUno = (playerIndex: number, round: Round): Round => {
  if (round.playerInTurn === undefined)
    throw new Error("Error: game has ended");

  if (playerIndex < 0 || playerIndex >= round.players.length)
    throw new Error("Error: invalid player index");

  const newRound = cloneRound(round);
  newRound.unoCalled[playerIndex] = true;

  return newRound;
};

export const checkUnoFailure = (
  accuser: { accuser: number; accused: number },
  round: Round
): boolean => {
  const accused = accuser.accused;

  if (accused < 0 || accused >= round.players.length)
    throw new Error("Error: invalid accused player index");

  if (round.unoFailureCandidate !== accused) return false;

  if (round.unoFailureChecked) return false;

  if (round.hands[accused].length === 1 && !round.unoCalled[accused])
    return true;

  return false;
};

export const catchUnoFailure = (
  accuser: { accuser: number; accused: number },
  round: Round
): Round => {
  const accused = accuser.accused;

  if (accused < 0 || accused >= round.players.length)
    throw new Error("Error: invalid accused player index");

  const newRound = cloneRound(round);
  if (newRound.hands[accused].length === 1 && !newRound.unoCalled[accused]) {
    drawMultiple(newRound, 4, accused);
    newRound.unoFailureChecked = true;
  }

  return newRound;
};

export const hasEnded = (round: Round): boolean => {
  return round.hands.some((hand) => hand.length === 0);
};

export const winner = (round: Round): number | undefined => {
  const winnerIndex = round.hands.findIndex((hand) => hand.length === 0);
  return winnerIndex >= 0 ? winnerIndex : undefined;
};

export const score = (round: Round): number | undefined => {
  if (!hasEnded(round)) return undefined;

  let totalScore = 0;

  round.hands.forEach((hand) => {
    hand.forEach((card) => {
      if (card.type === "NUMBERED") {
        totalScore += card.number!;
      } else if (["SKIP", "REVERSE", "DRAW"].includes(card.type)) {
        totalScore += 20;
      } else if (card.type === "WILD" || card.type === "WILD DRAW") {
        totalScore += 50;
      }
    });
  });

  return totalScore;
};

export const createRound = (
  players: string[],
  dealer: number,
  shuffler?: (deck: Deck) => Deck,
  cardsPerPlayer: number = 7
): Round => {
  if (players.length < 2 || players.length > 10)
    throw new Error(`Error: players count should be between 2 and 10`);

  if (!shuffler) shuffler = standardShuffler;

  const deck = createInitialDeck();
  const shuffledDeck = shuffler(deck);

  const hands = Array.from({ length: players.length }, (_, index) =>
    shuffledDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
  );

  const discardPile = [shuffledDeck[cardsPerPlayer * players.length]]; // First card
  let drawPile = shuffledDeck.slice(cardsPerPlayer * players.length + 1); // All other cards remained

  let playerInTurn = (dealer + 1) % players.length;
  let topCard = discardPile[0];

  const reshuffleIfWildCard = (topCard: Card): Deck => {
    if (topCard.type === "WILD" || topCard.type === "WILD DRAW") {
      let reshuffledDeck = shuffler(drawPile);
      discardPile[0] = reshuffledDeck[0];
      return reshuffledDeck.slice(1);
    }
    return drawPile;
  };

  while (topCard.type === "WILD" || topCard.type === "WILD DRAW") {
    drawPile = reshuffleIfWildCard(topCard);
    topCard = discardPile[0];
  }

  const currentColor: Color = topCard.color!;

  let direction: Direction = "clockwise";

  if (topCard.type === "REVERSE") {
    direction = "counterclockwise";
    playerInTurn = (dealer + (players.length - 1)) % players.length;
  } else if (topCard.type === "SKIP") {
    playerInTurn = (dealer + 2) % players.length;
  } else if (topCard.type === "DRAW") {
    playerInTurn = (dealer + 1) % players.length;
    hands[playerInTurn].push(drawPile.shift()!);
    hands[playerInTurn].push(drawPile.shift()!);
    playerInTurn = (dealer + 2) % players.length;
  }

  return {
    players,
    dealer,
    playerCount: players.length,
    hands,
    discardPile,
    drawPile,
    playerInTurn,
    currentColor,
    currentDirection: direction,
    shuffler,
    unoCalled: Array(players.length).fill(false),
    unoFailureChecked: false,
    unoFailureCandidate: undefined,
  };
};
