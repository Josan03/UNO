import { Game } from "domain/src/model/uno";
import { Round } from "domain/src/model/round";
import { Card } from "domain/src/model/deck";

export interface IndexedUno extends Game {
  id: string;
  pending: false;
}

export type IndexedUnoSpecs = {
  id: string;
  pending: true;
  creator: string;
  players: string[];
  numberOfPlayers: number;
};

export type GraphQLCard = {
  type: string;
  color?: string;
  number?: number;
};

export type GraphQLRound = {
  players: string[];
  hands: GraphQLCard[][];
  drawPile: GraphQLCard[];
  discardPile: GraphQLCard[];
  currentColor: string;
  currentDirection: string;
  dealer: number;
  playerInTurn?: number;
};

export type GraphQLGame = {
  id: string;
  pending: boolean;
  cardsPerPlayer: number;
  players: string[];
  targetScore: number;
  scores: number[];
  currentRound?: GraphQLRound;
};

function cardFromGraphQL(card: GraphQLCard): Card {
  const type = card.type as any;
  if (card.number !== undefined && card.color) {
    return { type, color: card.color as any, number: card.number };
  }
  if (card.color) {
    return { type, color: card.color as any };
  }
  return { type };
}

function roundFromGraphQL(round: GraphQLRound): Round {
  return {
    players: round.players,
    dealer: round.dealer,
    playerCount: round.players.length,
    hands: round.hands.map((hand) => hand.map(cardFromGraphQL)),
    drawPile: round.drawPile.map(cardFromGraphQL),
    discardPile: round.discardPile.map(cardFromGraphQL),
    playerInTurn: round.playerInTurn,
    currentColor: round.currentColor as any,
    currentDirection:
      round.currentDirection === "CLOCKWISE" ? "clockwise" : "counterclockwise",
    shuffler: (deck) => deck,
    unoCalled: Array(round.players.length).fill(false),
    unoFailureChecked: false,
    unoFailureCandidate: undefined,
  };
}

export function from_graphql_game(game: GraphQLGame): IndexedUno {
  return {
    id: game.id,
    pending: false,
    players: game.players,
    playerCount: game.players.length,
    targetScore: game.targetScore,
    scores: game.scores,
    winner: undefined,
    currentRound: game.currentRound
      ? roundFromGraphQL(game.currentRound)
      : undefined,
    cardsPerPlayer: game.cardsPerPlayer,
  };
}
