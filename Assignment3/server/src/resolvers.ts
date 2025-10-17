import { Round } from "../../domain/src/model/round"
import { API } from "./api"
import { to_memento } from "./memento"
import { IndexedGame, PendingGame, ServerError } from "./servermodel"
import { GraphQLError } from "graphql"
import { PubSub } from "graphql-subscriptions"

type GraphQlGame = {
    id: string
    pending: boolean
    players: readonly string[]
    targetScore: number
    playerCount: number
    scores: number[]
    cardsPerPlayer: number | undefined
    currentRound: Round
}

export function toGraphQLGame(game: IndexedGame): GraphQlGame {
    const memento = to_memento(game)
    return {
        id: memento.id,
        pending: false,
        players: memento.players,
        targetScore: memento.targetScore,
        playerCount: memento.players.length,
        scores: memento.scores,
        cardsPerPlayer: memento.cardsPerPlayer,
        currentRound: memento.currentRound
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
    console.log(res)
    return res.resolve({
        onSuccess: async g => toGraphQLGame(g),
        onError: async e => undefined
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
        onSuccess: async g => g,
        onError: async e => undefined
    })
}

async function new_game(api: API, params: { creator: string, numberOfPlayers: number }) {
    const res = await api.new_game(params.creator, params.numberOfPlayers)
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

async function join(api: API, params: { id: string, player: string }) {
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
            async game(id: string) {
                return game(api, id)
            },
            async pending_games() {
                return pending_games(api)
            },
            async pending_game(id: string) {
                return pending_game(api, id)
            }
        },
        Mutation: {
            async create_game(_: any, params: { creator: string, numberOfPlayers: number }) {
                return new_game(api, params)
            },
            async join_game(_: any, params: { id: string, player: string }) {
                return join(api, params)
            },
        },
        Game: {
            __resolveType(obj: any) {
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