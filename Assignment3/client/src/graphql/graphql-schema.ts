import { gql } from '@apollo/client/core'

/* -------------------------------------------------------------------------------------------------
 * Query
 * -----------------------------------------------------------------------------------------------*/

export const GAMES_QUERY = gql`
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
`

export const GAME_BY_ID_QUERY = gql`
  {
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
  }
`

export const PENDING_GAMES_QUERY = gql`
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

export const PENDING_GAME_BY_ID_QUERY = gql`
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

/* -------------------------------------------------------------------------------------------------
 * Mutation
 * -----------------------------------------------------------------------------------------------*/

/* -------------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/
