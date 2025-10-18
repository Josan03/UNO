import { PubSub } from "graphql-subscriptions"
import { API } from "./api"
import { GraphQLError } from "graphql"
import { Round } from "../../domain/src/model/round"
import { ActiveGame, PendingGame, ServerError } from "./servermodel"
import { to_memento } from "./memento"

type GraphQLGame = {
    id: string
    pending: boolean
    players: readonly string[]
    targetScore: number,
    scores: number[],
    cardsPerPlayer?: number,
    currentRound?: Round
}

export function toGraphQLGame(game: ActiveGame): GraphQLGame {
    const memento = to_memento(game)
    return {
        id: memento.id,
        pending: false,
        players: memento.players,
        targetScore: memento.targetScore,
        scores: memento.scores,
        cardsPerPlayer: memento.cardsPerPlayer ?? 7,
        currentRound: memento.currentRound ?? undefined
    }
}

async function respond_with_error(err: ServerError): Promise<never> {
    throw new GraphQLError(err.type);
}

async function games(api: API): Promise<GraphQLGame[]> {
    const res = await api.games()
    return res.resolve({
        onSuccess: async gs => gs.map(toGraphQLGame),
        onError: respond_with_error
    })
}

async function pending_games(api: API): Promise<PendingGame[]> {
    const res = await api.pending_games();
    return res.resolve({
        onSuccess: async (gs) => gs,
        onError: respond_with_error,
    });
}

export const create_resolvers = (pubsub: PubSub, api: API) => {
    return {
        Query: {
            async games() {
                return games(api)
            },
            async pending_games() {
                return pending_games(api)
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
        Card: {
            __resolveType(obj: any) {
                if (obj.number)
                    return 'Numbered'
                if (!obj.number && obj.color)
                    return 'ColoredAction'
                else
                    return 'Wild'
            }
        }
    }
}