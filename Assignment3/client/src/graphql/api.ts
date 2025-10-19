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

/* -------------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/

export async function onGame(subscriber: (game: IndexedUno) => any) {
  const gameSubscriptionQuery = gql`
    subscription Active {
      active {
        cardsPerPlayer
        id
        pending
        players
        scores
        targetScore
        currentRound {
          players
          currentColor
          currentDirection
          dealer
          playerInTurn
          hands {
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
          drawPile {
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
          discardPile {
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

export async function onPending(subscriber: (game: IndexedUnoSpecs) => any) {
  const gameSubscriptionQuery = gql`
    subscription Pending {
      pending {
        creator
        id
        numberOfPlayers
        pending
        players
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

/* -------------------------------------------------------------------------------------------------
 * Query
 * -----------------------------------------------------------------------------------------------*/

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

const PENDING_GAMES_QUERY = gql`
  query PendingGames {
    pending_games {
      id
      pending
      creator
      numberOfPlayers
      players
    }
  }
`

const PENDING_GAME_QUERY = gql`
  query PendingGame($pendingGameId: ID!) {
    pending_game(id: $pendingGameId) {
      id
      pending
      creator
      numberOfPlayers
      players
    }
  }
`

export async function pending_games(): Promise<IndexedUnoSpecs[]> {
  const response = await query(PENDING_GAMES_QUERY)
  return response.pending_games
}

export async function pending_game(id: string): Promise<IndexedUnoSpecs | undefined> {
  const response = await query(PENDING_GAME_QUERY, { pendingGameId: id })
  if (response.pending_game === undefined) return undefined
  return response.pending_game
}

/* -------------------------------------------------------------------------------------------------
 * Mutation
 * -----------------------------------------------------------------------------------------------*/

// This function is not tested
export async function call_uno(
  callUnoId: number,
  accusedIndex: number,
  accuserIndex: number,
): Promise<IndexedUno> {
  const response = await mutate(
    gql`
      mutation Call_uno($callUnoId: ID!, $accusedIndex: Int!, $accuserIndex: Int!) {
        call_uno(id: $callUnoId, accusedIndex: $accusedIndex, accuserIndex: $accuserIndex) {
          id
          pending
          cardsPerPlayer
          players
          targetScore
          scores
        }
      }
    `,
    { callUnoId, accusedIndex, accuserIndex },
  )
  const updatedGame = response.call_uno
  return from_graphql_game(updatedGame)
}

// This function is not tested
export async function draw_card(
  drawCardId: number,
  playerIndex: number,
  autoPlayIfPossible: boolean,
  namedColorIfWild: string,
): Promise<IndexedUno> {
  const response = await mutate(
    gql`
      mutation Draw_card(
        $drawCardId: ID!
        $playerIndex: Int!
        $autoPlayIfPossible: Boolean
        $namedColorIfWild: Color
      ) {
        draw_card(
          id: $drawCardId
          playerIndex: $playerIndex
          autoPlayIfPossible: $autoPlayIfPossible
          namedColorIfWild: $namedColorIfWild
        ) {
          id
          pending
          cardsPerPlayer
          players
          targetScore
          scores
        }
      }
    `,
    { drawCardId, playerIndex, autoPlayIfPossible, namedColorIfWild },
  )
  const updatedGame = response.draw_card
  return from_graphql_game(updatedGame)
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

export async function play_card(
  playCardId: number,
  playerIndex: number,
  cardIndex: number,
  namedColor: string,
): Promise<IndexedUno> {
  const response = await mutate(
    gql`
      mutation Play_card(
        $playCardId: ID!
        $playerIndex: Int!
        $cardIndex: Int!
        $namedColor: Color
      ) {
        play_card(
          id: $playCardId
          playerIndex: $playerIndex
          cardIndex: $cardIndex
          namedColor: $namedColor
        ) {
          id
          pending
          cardsPerPlayer
          players
          targetScore
          scores
        }
      }
    `,
    { playCardId, playerIndex, cardIndex, namedColor },
  )
  const updatedGame = response.play_card
  return from_graphql_game(updatedGame)
}

export async function say_uno(sayUnoId: number, playerIndex: number): Promise<IndexedUno> {
  const response = await mutate(
    gql`
      mutation Say_uno($sayUnoId: ID!, $playerIndex: Int!) {
        say_uno(id: $sayUnoId, playerIndex: $playerIndex) {
          id
          pending
          cardsPerPlayer
          players
          targetScore
          scores
        }
      }
    `,
    { sayUnoId, playerIndex },
  )
  const updatedGame = response.say_uno
  return from_graphql_game(updatedGame)
}
