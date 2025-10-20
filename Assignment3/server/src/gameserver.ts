import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { promises as fs } from "fs"
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema"
import { WebSocketServer } from "ws"
import { useServer } from "graphql-ws/use/ws"
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { expressMiddleware } from "@as-integrations/express5";
import { create_resolvers, toGraphQLGame } from "./resolvers";
import { PubSub } from "graphql-subscriptions";
import { create_api } from "./api";
import { standardRandomizer } from "../../domain/src/utils/random_utils";
import { ActiveGame, GameStore, PendingGame } from "./servermodel";
import { MemoryStore } from "./memorystore";

const currentRoundMemento = {
    players: ['Cristian', 'Emanuel'],
    hands: [
        [
            { type: 'WILD' },
            { type: 'DRAW', color: 'GREEN' },
        ],
        [{ type: 'NUMBERED', color: 'RED', number: 7 }],
    ],
    drawPile: [
        { type: 'WILD_DRAW' }
    ],
    discardPile: [
        { type: 'NUMBERED', color: 'BLUE', number: 7 },
        { type: 'SKIP', color: 'BLUE' },
    ],
    currentColor: 'BLUE',
    currentDirection: "CLOCKWISE",
    dealer: 1,
    playerInTurn: 0,
}

const activeGames = [
    {
        id: '0',
        pending: false,
        cardsPerPlayer: 7,
        players: ["Cristian", "Emanuel"],
        targetScore: 500,
        scores: [200, 250],
        currentRound: currentRoundMemento
    },
    {
        id: '1',
        pending: false,
        cardsPerPlayer: 7,
        players: ["Emanuel", "Mihai", "Cristian"],
        targetScore: 500,
        scores: [200, 250, 510],
        currentRound: undefined
    },
]

const pendingGames = [
    {
        id: '2',
        pending: true,
        creator: "Cristian",
        numberOfPlayers: 4,
        players: ["Cristian"]
    },
    {
        id: '3',
        pending: true,
        creator: "Cristian",
        numberOfPlayers: 4,
        players: []
    },
]

async function startServer(store: GameStore) {
    const pubsub: PubSub = new PubSub()
    const broadcaster = {
        async send(game: PendingGame | ActiveGame) {
            if (game.pending) {
                pubsub.publish('PENDING_UPDATED', { pending: game as PendingGame })
            } else {
                pubsub.publish('ACTIVE_UPDATED', { active: toGraphQLGame(game as ActiveGame) })
            }
        }
    }
    const api = create_api(broadcaster, store, standardRandomizer)

    try {
        const content = await fs.readFile('./game.sdl', 'utf8')
        const typeDefs = `#graphql
            ${content}
        `
        const resolvers = create_resolvers(pubsub, api)
        const schema = makeExecutableSchema({ typeDefs, resolvers })

        const app = express();
        app.use("/graphql", bodyParser.json());
        app.use(
            cors({
                origin: /:\/\/localhost:/,
                methods: ["GET", "POST", "OPTIONS"],
            })
        );
        const httpServer = createServer(app);

        const wsServer = new WebSocketServer({
            server: httpServer,
            path: '/graphql',
        })

        const subscriptionServer = useServer({ schema }, wsServer)

        const server = new ApolloServer({
            schema,
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await subscriptionServer.dispose()
                            },
                        }
                    },
                },
            ],
        })

        await server.start()
        app.use("/graphql", expressMiddleware(server))

        const PORT = 4000;

        httpServer.listen(PORT, () => {
            console.log(`Server ready at: http://localhost:${PORT}/graphql`)
        })
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

function configAndStart() {
    startServer(new MemoryStore(activeGames, pendingGames))
}

configAndStart()