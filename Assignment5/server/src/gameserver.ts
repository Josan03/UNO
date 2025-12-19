import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import express from "express";
import bodyParser from "body-parser";
import http from "http";
import { promises as fs } from "fs";
import { WebSocketServer } from "ws";

import { IndexedUno, PendingGame } from "./servermodel";
import { create_api, GameStore } from "./api";
import { MemoryStore } from "./memorystore";
import cors from "cors";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/use/ws";
import { PubSub } from "graphql-subscriptions";
import { create_resolvers, toGraphQLGame } from "./resolvers";

// Test game for development
const game0: IndexedUno = {
  id: "0",
  players: ["Alice", "Bob"],
  targetScore: 200,
  playerCount: 2,
  scores: [0, 0],
  winner: undefined,
  currentRound: undefined,
  pending: false,
  cardsPerPlayer: 7,
};

async function startServer(store: GameStore) {
  const pubsub: PubSub = new PubSub();
  const broadcaster = {
    async send(game: PendingGame | IndexedUno) {
      if (game.pending) {
        pubsub.publish("PENDING_UPDATED", { pending: game });
      } else {
        pubsub.publish("ACTIVE_UPDATED", { active: toGraphQLGame(game) });
      }
    },
  };
  const api = create_api(broadcaster, store);

  try {
    const content = await fs.readFile("./uno.sdl", "utf8");
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
      path: "/graphql",
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
  // For now, just use memory store
  // Can add MongoDB support later if needed
  startServer(new MemoryStore(game0));
}

configAndStart();
