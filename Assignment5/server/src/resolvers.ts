import { API, ServerError } from "./api";
import { GraphQLError } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { IndexedUno, PendingGame } from "./servermodel";
import { Card, Color } from "../../domain/src/model/deck";
import { Round } from "../../domain/src/model/round";

type GraphQLCard = {
  type: string;
  color?: string;
  number?: number;
};

type GraphQLRound = {
  players: string[];
  hands: GraphQLCard[][];
  drawPile: GraphQLCard[];
  discardPile: GraphQLCard[];
  currentColor: string;
  currentDirection: string;
  dealer: number;
  playerInTurn?: number;
};

type GraphQLGame = {
  id: string;
  pending: boolean;
  cardsPerPlayer: number;
  players: string[];
  targetScore: number;
  scores: number[];
  currentRound?: GraphQLRound;
};

function cardToGraphQL(card: Card): GraphQLCard {
  const result: GraphQLCard = { type: card.type };
  if ("color" in card && card.color) {
    result.color = card.color;
  }
  if ("number" in card && card.number !== undefined) {
    result.number = card.number;
  }
  return result;
}

function roundToGraphQL(round: Round): GraphQLRound {
  return {
    players: round.players,
    hands: round.hands.map((hand) => hand.map(cardToGraphQL)),
    drawPile: round.drawPile.map(cardToGraphQL),
    discardPile: round.discardPile.map(cardToGraphQL),
    currentColor: round.currentColor,
    currentDirection:
      round.currentDirection === "clockwise" ? "CLOCKWISE" : "COUNTERCLOCKWISE",
    dealer: round.dealer,
    playerInTurn: round.playerInTurn,
  };
}

export function toGraphQLGame(game: IndexedUno): GraphQLGame {
  return {
    id: game.id,
    pending: false,
    cardsPerPlayer: game.cardsPerPlayer ?? 7,
    players: game.players,
    targetScore: game.targetScore,
    scores: game.scores,
    currentRound: game.currentRound
      ? roundToGraphQL(game.currentRound)
      : undefined,
  };
}

async function respond_with_error(err: ServerError): Promise<never> {
  throw new GraphQLError(err.type);
}

async function games(api: API): Promise<GraphQLGame[]> {
  const res = await api.games();
  return res.resolve({
    onSuccess: async (gs) => gs.map(toGraphQLGame),
    onError: respond_with_error,
  });
}

async function game(api: API, id: string): Promise<GraphQLGame | undefined> {
  const res = await api.game(id);
  return res.resolve({
    onSuccess: (g) => toGraphQLGame(g),
    onError: (e) => undefined,
  });
}

async function pending_games(api: API): Promise<PendingGame[]> {
  const res = await api.pending_games();
  return res.resolve({
    onSuccess: async (gs) => gs,
    onError: respond_with_error,
  });
}

async function pending_game(
  api: API,
  id: string
): Promise<PendingGame | undefined> {
  const res = await api.pending_game(id);
  return res.resolve({
    onSuccess: (g) => g,
    onError: (e) => undefined,
  });
}

async function create_game(
  api: API,
  params: { creator: string; numberOfPlayers: number; targetScore?: number }
) {
  const res = await api.create_game(
    params.creator,
    params.numberOfPlayers,
    params.targetScore
  );
  return res.resolve({
    onSuccess: async (game) => {
      if (game.pending) return game;
      else return toGraphQLGame(game);
    },
    onError: respond_with_error,
  });
}

async function join_game(api: API, params: { id: string; player: string }) {
  const res = await api.join_game(params.id, params.player);
  return res.resolve({
    onSuccess: async (game) => {
      if (game.pending) return game;
      else return toGraphQLGame(game);
    },
    onError: respond_with_error,
  });
}

export const create_resolvers = (pubsub: PubSub, api: API) => {
  return {
    Query: {
      async games() {
        return games(api);
      },
      async game(_: any, params: { id: string }) {
        return game(api, params.id);
      },
      async pending_games() {
        return pending_games(api);
      },
      async pending_game(_: any, params: { id: string }) {
        return pending_game(api, params.id);
      },
    },
    Mutation: {
      async create_game(
        _: any,
        params: {
          creator: string;
          numberOfPlayers: number;
          targetScore?: number;
        }
      ) {
        return create_game(api, params);
      },
      async join_game(_: any, params: { id: string; player: string }) {
        return join_game(api, params);
      },
      async play_card(
        _: any,
        params: {
          id: string;
          playerIndex: number;
          cardIndex: number;
          namedColor?: Color;
        }
      ) {
        const res = await api.play_card(
          params.id,
          params.cardIndex,
          params.namedColor,
          params.playerIndex
        );
        return res.resolve({
          onSuccess: async (game) => toGraphQLGame(game),
          onError: respond_with_error,
        });
      },
      async draw_card(_: any, params: { id: string; playerIndex: number }) {
        const res = await api.draw_card(params.id, params.playerIndex);
        return res.resolve({
          onSuccess: async (game) => toGraphQLGame(game),
          onError: respond_with_error,
        });
      },
      async say_uno(_: any, params: { id: string; playerIndex: number }) {
        const res = await api.say_uno(params.id, params.playerIndex);
        return res.resolve({
          onSuccess: async (game) => toGraphQLGame(game),
          onError: respond_with_error,
        });
      },
      async call_uno(
        _: any,
        params: { id: string; accuserIndex: number; accusedIndex: number }
      ) {
        const res = await api.call_uno(
          params.id,
          params.accuserIndex,
          params.accusedIndex
        );
        return res.resolve({
          onSuccess: async (game) => toGraphQLGame(game),
          onError: respond_with_error,
        });
      },
    },
    Game: {
      __resolveType(obj: any) {
        if (obj.pending) return "PendingGame";
        else return "ActiveGame";
      },
    },
    Card: {
      __resolveType(obj: any) {
        if (obj.number !== undefined) return "Numbered";
        if (obj.color !== undefined) return "ColoredAction";
        return "Wild";
      },
    },
    Subscription: {
      active: {
        subscribe: () => pubsub.asyncIterableIterator(["ACTIVE_UPDATED"]),
      },
      pending: {
        subscribe: () => pubsub.asyncIterableIterator(["PENDING_UPDATED"]),
      },
    },
  };
};
