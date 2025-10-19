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

export const CALL_UNO_MUTATION = gql`
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
`

export const DRAW_CARD_MUTATION = gql`
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
`

export const CREATE_GAME_MUTATION = gql`
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
`
export const JOIN_GAME_MUTATION = gql`
  mutation Join_game($joinGameId: ID!, $player: String!) {
    join_game(id: $joinGameId, player: $player) {
      ... on ActiveGame {
        id
        pending
        cardsPerPlayer
        players
        targetScore
        scores
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
`
export const PLAY_CARD_MUTATION = gql`
  mutation Play_card($playCardId: ID!, $playerIndex: Int!, $cardIndex: Int!, $namedColor: Color) {
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
`
export const SAY_UNO_MUTATION = gql`
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
`

/* -------------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/

export const ON_GAME_SUBSCRIPTION = gql`
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
export const ON_PENDING_SUBSCRIPTION = gql`
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
