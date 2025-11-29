import { ApolloClient, gql, InMemoryCache, type DocumentNode, HttpLink, ApolloLink } from "@apollo/client/core";
import { type GraphQlGame, type IndexedYahtzee, type IndexedYahtzeeSpecs, from_graphql_game } from "./game";
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import type { SlotKey } from "domain/src/model/yahtzee.score"
import * as _ from 'lodash/fp'
import { subscriptionsRxJS } from "./rxjs";

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}))

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
})

const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink,
)

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
})

async function query(query: DocumentNode, variables?: object): Promise<unknown> {
  const result = await apolloClient.query({ query, variables, fetchPolicy: 'network-only' })    
  return result.data
}  

async function mutate(mutation: DocumentNode, variables?: object): Promise<unknown> {
  const result = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'network-only' })    
  return result.data
}  

export async function gameRxJS() {
  const gameSubscriptionQuery = gql`subscription GameSubscription {
    active {
      id
      pending
      players
      playerInTurn
      roll
      rolls_left
      scores {
        slot
        score
      }
    }
  }`
  const game = (evt: {active: GraphQlGame}) => from_graphql_game(evt.active)
  return subscriptionsRxJS(apolloClient, gameSubscriptionQuery, game)
}

export async function pendingRxJS() {
  const gameSubscriptionQuery = gql`subscription GameSubscription {
    pending {
      id
      pending
      creator
      players
      number_of_players
    }
  }`
  const pending = ({pending}: {pending: IndexedYahtzeeSpecs}) => pending
  return subscriptionsRxJS(apolloClient, gameSubscriptionQuery, pending)
}

export async function games(): Promise<IndexedYahtzee[]> {
  const games = await query(gql`{
    games {
      id
      players
      playerInTurn
      roll
      rolls_left
      scores {
        score
        slot
      }
    }
  }`) as {games: GraphQlGame[]}
  return games.games.map(from_graphql_game)
}

export async function game(id: string): Promise<IndexedYahtzee | undefined> {
  const response = await query(gql`
    query Game($id: String!) {
      game(id: $id) {
        id
        players
        playerInTurn
        roll
        rolls_left
        scores {
          score
          slot
        }
      }
    }`, {id}) as {game?: GraphQlGame}
  if (response.game === undefined)
    return undefined
  return from_graphql_game(response.game)
}

export async function pending_games(): Promise<IndexedYahtzeeSpecs[]> {
  const response = await query(gql`{
    pending_games {
      id
      players
      number_of_players
    }
  }`) as {pending_games: IndexedYahtzeeSpecs[]}
const games: Pick<IndexedYahtzeeSpecs, 'id' | 'players' | 'number_of_players'>[] = await response.pending_games;
  return games.map(_.set('pending', true)) as IndexedYahtzeeSpecs[]
}

export async function pending_game(id: string): Promise<IndexedYahtzeeSpecs | undefined> {
  const response = await query(gql`
    query PendingGame($id: String!) {
      pending_game(id: $id) {
        id
        number_of_players
        pending
        creator
        players
      }
    }`, {id}) as {pending_game?: IndexedYahtzeeSpecs}
    return await response.pending_game
}

export async function new_game(number_of_players: number, player: string): Promise<IndexedYahtzeeSpecs|IndexedYahtzee> {
  const response = await mutate(gql`
    mutation NewGame($creator: String!, $numberOfPlayers: Int!) {
      new_game(creator: $creator, number_of_players: $numberOfPlayers) {
      ... on PendingGame {
        id
        number_of_players
        pending
        creator
        players
      }
      ... on ActiveGame {
        id
        pending
        players
        playerInTurn
        roll
        rolls_left
        scores {
          slot
          score
        }
      }    
    }
  }`, { creator: player, numberOfPlayers: number_of_players }) as {new_game: IndexedYahtzeeSpecs | GraphQlGame }
  const game = response.new_game
  if (game.pending)
    return game as IndexedYahtzeeSpecs
  else
    return from_graphql_game(game)
}

export async function join(game: IndexedYahtzeeSpecs, player: string): Promise<IndexedYahtzeeSpecs|IndexedYahtzee> {
  const response = await mutate(gql`
    mutation Join($id: ID!, $player: String!) {
      join(id: $id, player: $player) {
      ... on PendingGame {
        id
        number_of_players
        pending
        creator
        players
      }
      ... on ActiveGame {
        id
        pending
        players
        playerInTurn
        roll
        rolls_left
        scores {
          slot
          score
        }
      }    
    }
  }`, { id: game.id, player }) as {join: IndexedYahtzeeSpecs | GraphQlGame}
  const joinedGame = response.join
  if (joinedGame.pending)
    return joinedGame as IndexedYahtzeeSpecs
  else
    return from_graphql_game(joinedGame)
}

export async function reroll(game: IndexedYahtzee, held: number[], player: string) {
  const response = await mutate(gql`
    mutation Reroll($id: ID!, $held: [Int!]!, $player: String!) {
      reroll(id: $id, held: $held, player: $player) {
        id
        pending
        players
        playerInTurn
        roll
        rolls_left
        scores {
          slot
          score
        }
      }
    }`, { id: game.id, held, player }) as { reroll: GraphQlGame }
  const updatedGame = response.reroll
  return from_graphql_game(updatedGame)
}

export async function register(game: IndexedYahtzee, slot: SlotKey, player: string) {
  const response = await mutate(gql`
    mutation Register($id: ID!, $slot: String!, $player: String!) {
      register(id: $id, slot: $slot, player: $player) {
        id
        pending
        players
        playerInTurn
        roll
        rolls_left
        scores {
          slot
          score
        }
      }
    }`, { id: game.id, slot: slot.toString(), player }) as { register: GraphQlGame }
  const updatedGame = response.register
  return from_graphql_game(updatedGame)
}
