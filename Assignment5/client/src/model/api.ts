import {
  ApolloClient,
  gql,
  InMemoryCache,
  type DocumentNode,
  HttpLink,
  ApolloLink,
} from "@apollo/client/core";
import {
  type GraphQLGame,
  type IndexedUno,
  type IndexedUnoSpecs,
  from_graphql_game,
} from "./game";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import * as _ from "lodash/fp";
import { subscriptionsRxJS } from "./rxjs";
import { Color, Card } from "domain/src/model/deck";

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
  })
);

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

async function query(
  query: DocumentNode,
  variables?: object
): Promise<unknown> {
  const result = await apolloClient.query({
    query,
    variables,
    fetchPolicy: "network-only",
  });
  return result.data;
}

async function mutate(
  mutation: DocumentNode,
  variables?: object
): Promise<unknown> {
  const result = await apolloClient.mutate({
    mutation,
    variables,
    fetchPolicy: "network-only",
  });
  return result.data;
}

const CARD_FRAGMENT = gql`
  fragment CardFields on Card {
    ... on Numbered {
      type
      color
      number
    }
    ... on ColoredAction {
      type
      color
    }
    ... on Wild {
      type
    }
  }
`;

const ROUND_FRAGMENT = gql`
  ${CARD_FRAGMENT}
  fragment RoundFields on Round {
    players
    hands {
      ...CardFields
    }
    drawPile {
      ...CardFields
    }
    discardPile {
      ...CardFields
    }
    currentColor
    currentDirection
    dealer
    playerInTurn
  }
`;

const GAME_FRAGMENT = gql`
  ${ROUND_FRAGMENT}
  fragment GameFields on ActiveGame {
    id
    cardsPerPlayer
    players
    targetScore
    scores
    currentRound {
      ...RoundFields
    }
  }
`;

export async function gameRxJS() {
  const gameSubscriptionQuery = gql`
    ${GAME_FRAGMENT}
    subscription GameSubscription {
      active {
        ...GameFields
      }
    }
  `;
  const game = (evt: { active: GraphQLGame }) => from_graphql_game(evt.active);
  return subscriptionsRxJS(apolloClient, gameSubscriptionQuery, game);
}

export async function pendingRxJS() {
  const gameSubscriptionQuery = gql`
    subscription PendingSubscription {
      pending {
        id
        pending
        creator
        players
        numberOfPlayers
        targetScore
      }
    }
  `;
  const pending = ({ pending }: { pending: IndexedUnoSpecs }) => pending;
  return subscriptionsRxJS(apolloClient, gameSubscriptionQuery, pending);
}

export async function games(): Promise<IndexedUno[]> {
  const games = (await query(gql`
    ${GAME_FRAGMENT}
    {
      games {
        ...GameFields
      }
    }
  `)) as { games: GraphQLGame[] };
  return games.games.map(from_graphql_game);
}

export async function game(id: string): Promise<IndexedUno | undefined> {
  const response = (await query(
    gql`
      ${GAME_FRAGMENT}
      query Game($id: ID!) {
        game(id: $id) {
          ...GameFields
        }
      }
    `,
    { id }
  )) as { game?: GraphQLGame };
  if (response.game === undefined) return undefined;
  return from_graphql_game(response.game);
}

export async function pending_games(): Promise<IndexedUnoSpecs[]> {
  const response = (await query(gql`
    {
      pending_games {
        id
        pending
        creator
        players
        numberOfPlayers
      }
    }
  `)) as { pending_games: IndexedUnoSpecs[] };
  return response.pending_games;
}

export async function pending_game(
  id: string
): Promise<IndexedUnoSpecs | undefined> {
  const response = (await query(
    gql`
      query PendingGame($id: ID!) {
        pending_game(id: $id) {
          id
          pending
          creator
          players
          numberOfPlayers
        }
      }
    `,
    { id }
  )) as { pending_game?: IndexedUnoSpecs };
  return await response.pending_game;
}

export async function create_game(
  numberOfPlayers: number,
  player: string
): Promise<IndexedUnoSpecs | IndexedUno> {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation CreateGame($creator: String!, $numberOfPlayers: Int!) {
        create_game(creator: $creator, numberOfPlayers: $numberOfPlayers) {
          ... on PendingGame {
            id
            pending
            creator
            players
            numberOfPlayers
          }
          ... on ActiveGame {
            ...GameFields
          }
        }
      }
    `,
    { creator: player, numberOfPlayers }
  )) as { create_game: IndexedUnoSpecs | GraphQLGame };
  const game = response.create_game;
  if (game.pending) return game as IndexedUnoSpecs;
  else return from_graphql_game(game);
}

export async function join_game(
  game: IndexedUnoSpecs,
  player: string
): Promise<IndexedUnoSpecs | IndexedUno> {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation JoinGame($id: ID!, $player: String!) {
        join_game(id: $id, player: $player) {
          ... on PendingGame {
            id
            pending
            creator
            players
            numberOfPlayers
          }
          ... on ActiveGame {
            ...GameFields
          }
        }
      }
    `,
    { id: game.id, player }
  )) as { join_game: IndexedUnoSpecs | GraphQLGame };
  const joinedGame = response.join_game;
  if (joinedGame.pending) return joinedGame as IndexedUnoSpecs;
  else return from_graphql_game(joinedGame);
}

export async function play_card(
  game: IndexedUno,
  cardIndex: number,
  playerIndex: number,
  namedColor?: Color
) {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation PlayCard(
        $id: ID!
        $playerIndex: Int!
        $cardIndex: Int!
        $namedColor: Color
      ) {
        play_card(
          id: $id
          playerIndex: $playerIndex
          cardIndex: $cardIndex
          namedColor: $namedColor
        ) {
          ...GameFields
        }
      }
    `,
    { id: game.id, playerIndex, cardIndex, namedColor }
  )) as { play_card: GraphQLGame };
  return from_graphql_game(response.play_card);
}

export async function draw_card(game: IndexedUno, playerIndex: number) {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation DrawCard($id: ID!, $playerIndex: Int!) {
        draw_card(id: $id, playerIndex: $playerIndex) {
          ...GameFields
        }
      }
    `,
    { id: game.id, playerIndex }
  )) as { draw_card: GraphQLGame };
  return from_graphql_game(response.draw_card);
}

export async function say_uno(game: IndexedUno, playerIndex: number) {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation SayUno($id: ID!, $playerIndex: Int!) {
        say_uno(id: $id, playerIndex: $playerIndex) {
          ...GameFields
        }
      }
    `,
    { id: game.id, playerIndex }
  )) as { say_uno: GraphQLGame };
  return from_graphql_game(response.say_uno);
}

export async function call_uno(
  game: IndexedUno,
  accuserIndex: number,
  accusedIndex: number
) {
  const response = (await mutate(
    gql`
      ${GAME_FRAGMENT}
      mutation CallUno($id: ID!, $accuserIndex: Int!, $accusedIndex: Int!) {
        call_uno(
          id: $id
          accuserIndex: $accuserIndex
          accusedIndex: $accusedIndex
        ) {
          ...GameFields
        }
      }
    `,
    { id: game.id, accuserIndex, accusedIndex }
  )) as { call_uno: GraphQLGame };
  return from_graphql_game(response.call_uno);
}

// Helper functions that convert player names to indices
export async function playCard(id: string, player: string, card: Card) {
  const g = await game(id);
  if (!g) throw new Error("Game not found");
  const playerIndex = g.players.indexOf(player);
  if (playerIndex === -1) throw new Error("Player not in game");
  const cardIndex = g.currentRound?.hands[playerIndex]?.findIndex(
    (c) => JSON.stringify(c) === JSON.stringify(card)
  );
  if (cardIndex === undefined || cardIndex === -1)
    throw new Error("Card not in hand");
  return await play_card(g, cardIndex, playerIndex);
}

export async function drawCard(id: string, player: string) {
  const g = await game(id);
  if (!g) throw new Error("Game not found");
  const playerIndex = g.players.indexOf(player);
  if (playerIndex === -1) throw new Error("Player not in game");
  return await draw_card(g, playerIndex);
}

export async function sayUno(id: string, player: string) {
  const g = await game(id);
  if (!g) throw new Error("Game not found");
  const playerIndex = g.players.indexOf(player);
  if (playerIndex === -1) throw new Error("Player not in game");
  return await say_uno(g, playerIndex);
}

export async function callUno(id: string, accuser: string, accused: string) {
  const g = await game(id);
  if (!g) throw new Error("Game not found");
  const accuserIndex = g.players.indexOf(accuser);
  const accusedIndex = g.players.indexOf(accused);
  if (accuserIndex === -1 || accusedIndex === -1)
    throw new Error("Player not in game");
  return await call_uno(g, accuserIndex, accusedIndex);
}
