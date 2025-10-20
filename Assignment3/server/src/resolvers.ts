import { PubSub } from "graphql-subscriptions";
import { API } from "./api";
import { GraphQLError } from "graphql";
import { Round } from "../../domain/src/model/round";
import { ActiveGame, PendingGame, ServerError } from "./servermodel";
import { to_memento } from "./memento";
import { subscribe } from "diagnostics_channel";
import { Color } from "../../domain/src/model/card";

type GraphQLGame = {
    id: string;
    pending: boolean;
    players: readonly string[];
    targetScore: number;
    scores: number[];
    cardsPerPlayer?: number;
    currentRound?: Round;
};

export function toGraphQLGame(game: ActiveGame): GraphQLGame {
    const memento = to_memento(game);
    return {
        id: memento.id,
        pending: false,
        players: memento.players,
        targetScore: memento.targetScore,
        scores: memento.scores,
        cardsPerPlayer: memento.cardsPerPlayer ?? 7,
        currentRound: memento.currentRound ?? undefined,
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

async function game(api: API, args: any): Promise<GraphQLGame> {
    const res = await api.game(args.id);
    return res.resolve({
        onSuccess: async (g) => toGraphQLGame(g),
        onError: async (e) => undefined,
    });
}

async function create_game(api: API, args: { creator: string, numberOfPlayers: number }) {
    const res = await api.create_game(args.creator, args.numberOfPlayers)
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

async function join_game(api: API, args: { id: string, player: string }) {
    const res = await api.join(args.id, args.player)
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

async function play_card(api: API, args: { id: string, playerIndex: number, cardIndex: number, namedColor?: Color }) {
    const res = await api.play_card(args.id, args.playerIndex, args.cardIndex, args.namedColor)
    return res.resolve({
        onSuccess: async (g) => toGraphQLGame(g),
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

async function pending_game(api: API, args: any): Promise<PendingGame> {
    const res = await api.pending_game(args.id);
    return res.resolve({
        onSuccess: async (gs) => gs,
        onError: async (e) => undefined,
    });
}

export const create_resolvers = (pubsub: PubSub, api: API) => {
    return {
        Direction: {
            CLOCKWISE: "clockwise",
            COUNTERCLOCKWISE: "counterclockwise"
        },
        Card: {
            __resolveType(obj: any) {
                if (obj.number) return "Numbered";
                if (!obj.number && obj.color) return "ColoredAction";
                else return "Wild";
            },
        },
        Round: {
            drawPile: (obj: any) => {
                return obj.drawPile.toMemento() ?? [];
            },
            discardPile: (obj: any) => {
                return obj.discardPile.toMemento() ?? [];
            },
            playerInTurn: (obj: any) => {
                return obj.currentPlayerIndex;
            }
        },
        Game: {
            __resolveType(obj: any) {
                if (obj.pending) return "PendingGame";
                else return "ActiveGame";
            },
        },
        Query: {
            async games() {
                return games(api);
            },
            async game(_, args) {
                return game(api, args);
            },
            async pending_games() {
                return pending_games(api);
            },
            async pending_game(_, args) {
                return pending_game(api, args);
            },
        },
        Mutation: {
            async create_game(_, args: { creator: string, numberOfPlayers: number }) {
                return create_game(api, args)
            },
            async join_game(_, args: { id: string, player: string }) {
                return join_game(api, args)
            },
            async play_card(_, args: { id: string, playerIndex: number, cardIndex: number, namedColor?: Color }) {
                return play_card(api, args)
            },
        },
        Subscription: {
            active: {
                subscribe: () => pubsub.asyncIterableIterator(['ACTIVE_UPDATED'])
            },
            pending: {
                subscribe: () => pubsub.asyncIterableIterator(['PENDING_UPDATED'])
            },
        },
    };
};
