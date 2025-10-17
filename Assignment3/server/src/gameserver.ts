import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import express from "express";
import bodyParser from "body-parser";
import http from "http";
import { promises as fs } from "fs";
import { WebSocketServer } from "ws";

import { GameStore, IndexedGame, PendingGame } from "./servermodel";
import { from_memento, IndexedMemento } from "./memento";
import { standardRandomizer } from "../../domain/src/utils/random_utils";
import { create_api } from "./api";
import { useServer } from "graphql-ws/use/ws";
import cors from "cors";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { create_resolvers, toGraphQLGame } from "./resolvers";
import { MongoStore } from "./mongostore";
import { MemoryStore } from "./memorystore";
import { createUnoGame, GameMemento, UnoGame } from "../../domain/src/model/uno";
import { Round } from "../../domain/src/model/round";

const currentRoundMemento: any = {
  players: ['Cristian', 'Emanuel'],
  hands: [
    [
      { type: 'WILD' },
      { type: 'DRAW', color: 'GREEN' },
    ],
    [{ type: 'NUMBERED', color: 'RED', number: 7 }],
  ],
  drawPile: [
    { type: 'WILD DRAW' }
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

const game0 = createUnoGame(["Cristian", "Emanuel"], 500, { cardsPerPlayer: 7 })
const game1 = createUnoGame(["Cristian", "Emanuel"], 500, { cardsPerPlayer: 7 })

const games = [game0, game1]

async function startServer(store: GameStore) {
  const pubsub: PubSub = new PubSub();
  const broadcaster = {
    async send(game: PendingGame | IndexedGame) {
      if (game.pending) pubsub.publish("PENDING_UPDATED", { pending: game });
      else pubsub.publish("ACTIVE_UPDATED", { active: toGraphQLGame(game) });
    },
  };

  const api = create_api(broadcaster, store, standardRandomizer);

  try {
    const content = await fs.readFile("./game.sdl", "utf8");
    const typeDefs = `#graphql
            ${content}`;
    const resolvers = create_resolvers(pubsub, api);

    const app = express();
    app.use("/graphql", bodyParser.json());

    app.use(
      cors({
        origin: /:\/\/localhost:/,
        methods: ["GET", "POST", "OPTIONS"],
      })
    );

    const httpServer = http.createServer(app);

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const wsServer = new WebSocketServer({
      server: httpServer,
    });

    const subscriptionServer = useServer({ schema }, wsServer);

    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              drainServer: async () => subscriptionServer.dispose(),
            };
          },
        },
      ],
    });
    await server.start();
    app.use("/graphql", expressMiddleware(server));

    httpServer.listen({ port: 4000 }, () =>
      console.log(`GraphQL server ready on http://localhost:4000/graphql`)
    );
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

function configAndStart() {
  const mongoIndex = process.argv.indexOf("--mongodb");
  if (mongoIndex !== -1) {
    const connectionString = process.argv[mongoIndex + 1];
    if (!connectionString) throw new Error("--mongodb needs connection string");
    const dbNameIndex = process.argv.indexOf("--dbname");
    const dbName = dbNameIndex !== -1 ? process.argv[dbNameIndex + 1] : "test";
    startServer(MongoStore(connectionString, dbName, standardRandomizer));
  } else {
    const indexedGames = games.map(gameMemento => from_memento(gameMemento, standardRandomizer));
    startServer(new MemoryStore(...indexedGames));
  }
}

configAndStart();
