import {
  ApolloClient,
  gql,
  InMemoryCache,
  type DocumentNode,
  split,
  HttpLink,
} from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { from_graphql_game, type IndexedUno, type IndexedUnoSpecs } from './game'

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
  }),
)

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpLink,
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})

async function query(query: DocumentNode, variables?: Object): Promise<any> {
  const result = await apolloClient.query({ query, variables, fetchPolicy: 'network-only' })
  return result.data
}

async function mutate(mutation: DocumentNode, variables?: Object): Promise<any> {
  const result = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'network-only' })
  return result.data
}

export async function onGame(subscriber: (game: IndexedUno) => any) {
  const gameSubscriptionQuery = gql`
    subscription GameSubscription {
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
    }
  `
  const gameObservable = apolloClient.subscribe({ query: gameSubscriptionQuery })
  gameObservable.subscribe({
    next({ data }) {
      const game: IndexedUno = from_graphql_game(data.active)
      subscriber(game)
    },
    error(err) {
      console.error(err)
    },
  })
}

export async function games(): Promise<IndexedUno[]> {
  const memento = await query(gql`
    {
      games {
        id
        pending
        players
        targetScore
        scores
        cardsPerPlayer
      }
    }
  `)
  return memento.games.map(from_graphql_game)
}

export async function game(id: string): Promise<IndexedUno | undefined> {
  const response = await query(
    gql`
      query Game($id: String!) {
        game(id: $id) {
          id
          pending
          cardsPerPlayer
          players
          targetScore
          scores
        }
      }
    `,
    { id },
  )
  if (response.game === undefined) return undefined
  return from_graphql_game(response.game)
}

export async function onPending(subscriber: (game: IndexedUnoSpecs) => any) {
  const gameSubscriptionQuery = gql`
    subscription GameSubscription {
      pending {
        id
        pending
        creator
        players
        number_of_players
      }
    }
  `
  const gameObservable = apolloClient.subscribe({ query: gameSubscriptionQuery })
  gameObservable.subscribe({
    next({ data }) {
      const pending: IndexedUnoSpecs = data.pending
      subscriber(pending)
    },
    error(err) {
      console.error(err)
    },
  })
}

export async function pending_games(): Promise<IndexedUnoSpecs[]> {
  const response = await query(gql`
    {
      pending_games {
        id
        pending
        creator
        numberOfPlayers
        players
      }
    }
  `)
  const games: Pick<IndexedUnoSpecs, 'id' | 'creator' | 'number_of_players'>[] =
    await response.pending_games
  return games.map((g) => ({ ...g, pending: true }))
}

export async function pending_game(id: string): Promise<IndexedUnoSpecs | undefined> {
  const response = await query(
    gql`
      query PendingGame($id: String!) {
        pending_game(id: $pendingGameId) {
          id
          pending
          creator
          numberOfPlayers
          players
        }
      }
    `,
    { id },
  )
  return await response.pending_games
}

export async function create_game(
  number_of_players: number,
  player: string,
): Promise<IndexedUnoSpecs | IndexedUno> {
  const response = await mutate(
    gql`
      mutation Create_game($creator: String!, $numberOfPlayers: Int!) {
        create_game(creator: $creator, numberOfPlayers: $numberOfPlayers) {
          ... on ActiveGame {
            id
            cardsPerPlayer
            pending
            players
            scores
            targetScore
          }
          ... on PendingGame {
            id
            pending
            creator
            numberOfPlayers
            players
          }
        }
      }
    `,
    { creator: player, numberOfPlayers: number_of_players },
  )
  const game = response.create_game
  if (game.pending) {
    return game as IndexedUnoSpecs
  } else {
    return from_graphql_game(game)
  }
}

export async function join(
  game: IndexedUnoSpecs,
  player: string,
): Promise<IndexedUnoSpecs | IndexedUno> {
  const response = await mutate(
    gql`
      mutation Join($id: ID!, $player: String!) {
        join(id: $id, player: $player) {
          ... on PendingGame {
            id
            pending
            creator
            number_of_players
            players
          }
          ... on ActiveGame {
            id
            pending
            cardsPerPlayer
            players
            targetScore
            scores
            currentRound
          }
        }
      }
    `,
    { id: game.id, player },
  )
  const joinedGame = response.join
  if (joinedGame.pending) return joinedGame as IndexedUnoSpecs
  else return from_graphql_game(joinedGame)
}
