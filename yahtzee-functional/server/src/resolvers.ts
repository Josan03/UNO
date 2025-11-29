import { API, ServerError } from "./api";
import { GraphQLError } from "graphql";
import { PubSub } from "graphql-subscriptions";
import { PlayerScore } from "domain/src/model/yahtzee.game";
import { die_values } from "domain/src/model/dice";
import { lower_section_keys, SlotKey } from "domain/src/model/yahtzee.score";
import { IndexedYahtzee, PendingGame } from "./servermodel";

type GraphQLPlayerScore = {
  slot: string
  score: number | undefined
}[]

type GraphQlGame = {
  id: string
  pending: boolean
  players: readonly string[]
  playerInTurn: number
  roll: readonly (1 | 2 | 3 | 4 | 5 | 6)[]
  rolls_left: number
  scores: GraphQLPlayerScore[]
}

function create_scores(score: PlayerScore): GraphQLPlayerScore {
  const upper_section = die_values.map(k => ({slot: k.toString(), score: score.upper_section.scores[k]}))
  const lower_section = lower_section_keys.map(k => ({slot: k.toString(), score: score.lower_section.scores[k]}))
  return [...upper_section, {slot: 'bonus', score: score.upper_section.bonus}, ...lower_section]
}

export function toGraphQLGame(game: IndexedYahtzee): GraphQlGame {
  return {
    id: game.id,
    pending: false,
    players: game.players,
    playerInTurn: game.playerInTurn,
    roll: game.roll,
    rolls_left: game.rolls_left,
    scores: game.scores.map(create_scores),
  }
}

async function respond_with_error(err: ServerError): Promise<never> {
  throw new GraphQLError(err.type)
}

async function games(api: API): Promise<GraphQlGame[]> {
  const res = await api.games()
  return res.resolve({
    onSuccess: async gs => gs.map(toGraphQLGame),
    onError: respond_with_error
  })
}

async function game(api: API, id: string): Promise<GraphQlGame | undefined> {
  const res = await api.game(id)
  return res.resolve({
    onSuccess: g => toGraphQLGame(g),
    onError: e => undefined
  })
}

async function pending_games(api: API): Promise<PendingGame[]> {
  const res = await api.pending_games()
  return res.resolve({
    onSuccess: async gs => gs,
    onError: respond_with_error
  })
}

async function pending_game(api: API, id: string): Promise<PendingGame | undefined> {
  const res = await api.pending_game(id)
  return res.resolve({
    onSuccess: g => g,
    onError: e => undefined
  })
}

async function new_game(api: API, params: {creator: string, number_of_players: number}) {
  const res = await api.new_game(params.creator, params.number_of_players)
  return res.resolve({
    onSuccess: async game => {
      if (game.pending)
        return game
      else
        return toGraphQLGame(game)
    },
    onError: respond_with_error
  })
}

async function join(api: API, params: {id: string, player: string}) {
    const res = await api.join(params.id, params.player)
    return res.resolve({
    onSuccess: async game => {
      if (game.pending)
        return game
      else
        return toGraphQLGame(game)
    },
    onError: respond_with_error
  })
}


export const create_resolvers = (pubsub: PubSub, api: API) => {
  return {
    Query: {
      async games() {
        return games(api)
      },
      async game(_:any, params: {id: string}) {
        return game(api, params.id)
      },
      async pending_games() {
        return pending_games(api)
      },
      async pending_game(id: string) {
        return pending_game(api, id)
      }
    },
    Mutation: {
      async new_game(_:any, params: {creator: string, number_of_players: number}) {
        return new_game(api, params)
      },
      async join(_:any, params: {id: string, player: string}) {
          return join(api, params)
      },
      async reroll(_: any, params: {id: string, held: number[], player: string}) {
        const res = await api.reroll(params.id, params.held, params.player)
        return res.resolve({
          onSuccess: async game => toGraphQLGame(game),
          onError: respond_with_error
        })
      },
      async register(_: any, params: {id: string, slot: SlotKey, player: string}) {
        const res = await api.register(params.id, params.slot, params.player)
        return res.resolve({
          onSuccess: async game => toGraphQLGame(game),
          onError: respond_with_error
        })
      }
    },
    Game: {
      __resolveType(obj:any) {
        if (obj.pending)
          return 'PendingGame'
        else
          return 'ActiveGame'
      }
    },
    Subscription: {
      active: {
        subscribe: () => pubsub.asyncIterableIterator(['ACTIVE_UPDATED'])
      },
      pending: {
        subscribe: () => pubsub.asyncIterableIterator(['PENDING_UPDATED'])
      }
    }
  }
}