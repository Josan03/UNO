import { promises as fs } from 'fs'

async function startServer() {
    try {
        const content = await fs.readFile('./server/game.sdl', 'utf8')
        const typeDefs = `#graphql
            ${content}`
        const resolvers = {}

        const app = express()
        app.use('/graphql', bodyParser.json())
        app.use('/graphql', (_, res, next) => {
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            res.header("Access-Control-Allow-Methods", "GET, POST, PATCH")
            next()
        })

        const httpServer = http.createServer(app)

        const server = new ApolloServer({
            typeDefs,
            resolvers,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        })
        await server.start()
        app.use('/graphql', expressMiddleware(server))
        app.use('/frontend', express.static('../frontend'))

        httpServer.listen({ port: 4000 }, () => console.log(`GraphQL server ready on http://localhost:4000`))
    } catch (err) {
        console.error(`Error: ${err}`)
    }
}

startServer()