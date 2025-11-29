import { Db, MongoClient, ObjectId, WithId } from "mongodb";
import { IndexedYahtzee, PendingGame } from "./servermodel";
import { Yahtzee } from "domain/src/model/yahtzee.game";
import { ServerResponse } from "./response";
import { GameStore, StoreError } from "./api";

function db_error(error: any): ServerResponse<never, StoreError> {
  return ServerResponse.error({ type: "DB Error", error })
}

function not_found(key: any): ServerResponse<never, StoreError>  {
  return ServerResponse.error({ type: "Not Found", key })
}

export function MongoStore(connectionString: string, dbName: string): GameStore {
  function from_mongo(m: WithId<Omit<IndexedYahtzee, 'id'>>): IndexedYahtzee {
    return { ...m, id: m._id.toHexString() }
  }

  function to_mongo(y: IndexedYahtzee): WithId<IndexedYahtzee> {
    return { ...y, _id: ObjectId.createFromHexString(y.id) }
  }

  const from_mongo_pending = (pg: WithId<Omit<PendingGame, "id">>) => ({ ...pg, id: pg._id.toHexString() })

  async function dbQuery<V>(q: (db: Db) => Promise<V | null>, key?: any): Promise<ServerResponse<V, StoreError>> {
    try {
      const client = new MongoClient(connectionString);
      await client.connect()
      const db = client.db(dbName);
      const result = await q(db)
      client.close()
      if (result == null)
        return not_found(key)
      return ServerResponse.ok(result)
    } catch (e) {
      return db_error(e)
    }    
  }

  async function dbUpdate(q: (db: Db) => Promise<void>): Promise<ServerResponse<null, StoreError>> {
    try {
      const client = new MongoClient(connectionString);
      await client.connect()
      const db = client.db(dbName);
      await q(db)
      client.close()
      return ServerResponse.ok(null)
    } catch(e) {
      return db_error(e)
    }
  }

  const yahtzee = (db: Db) => db.collection<Omit<IndexedYahtzee, 'id'>>('yahtzee')
  const pending = (db: Db) => db.collection<Omit<PendingGame, 'id'>>('yahtzee.pending')

  return {
    games(): Promise<ServerResponse<IndexedYahtzee[], StoreError>> {
      return dbQuery(async db => {
        const all = await yahtzee(db).find().toArray()
        return all.map(from_mongo)
      })
    },
    game(id: string): Promise<ServerResponse<IndexedYahtzee, StoreError>> {
      return dbQuery(async db => {
        const game = await yahtzee(db).findOne({_id: ObjectId.createFromHexString(id)})
        if (!game) return game
        return from_mongo(game)
      })
    },
    add(game: IndexedYahtzee | Yahtzee & {id?: string}): Promise<ServerResponse<IndexedYahtzee, StoreError>> {
      return dbQuery(async db => {
        if (game.id === undefined) {
          const result = await yahtzee(db).insertOne({...game, pending: false}, {ignoreUndefined: true})
          return { ...game, id: result.insertedId.toHexString(), pending: false}
        }
        await yahtzee(db).insertOne(to_mongo(game as IndexedYahtzee), {ignoreUndefined: true})
        return game as IndexedYahtzee
      })
    },
    update(game: IndexedYahtzee): Promise<ServerResponse<IndexedYahtzee, StoreError>> {
      return dbQuery(async db  => {
        const result = await yahtzee(db).replaceOne({ _id: ObjectId.createFromHexString(game.id) }, await to_mongo(game))
        return result.modifiedCount === 0? null: game
      })
    },
    pending_games(): Promise<ServerResponse<PendingGame[], StoreError>> {
      return dbQuery(async db => {
        const all = await pending(db).find().toArray()
        return all.map(from_mongo_pending)
      })
    },
    pending_game(id: string): Promise<ServerResponse<PendingGame, StoreError>> {
      return dbQuery(async db => {
        const game = await pending(db).findOne({_id: ObjectId.createFromHexString(id)})
        return game == null? null : from_mongo_pending(game)
      })
    },
    add_pending(game: Omit<PendingGame, "id">): Promise<ServerResponse<PendingGame, StoreError>> {
      return dbQuery(async db => {
        const result = await pending(db).insertOne(game, {ignoreUndefined: true})
        return { ...game, id: result.insertedId.toHexString() }
      })
    },
    delete_pending(id: string): Promise<ServerResponse<null, StoreError>> {
      return dbUpdate(async db => {
        await pending(db).deleteOne({_id: ObjectId.createFromHexString(id)})
      })
    },
    update_pending(game: PendingGame): Promise<ServerResponse<PendingGame, StoreError>> {
      return dbQuery(async db  => {
        const result = await pending(db).replaceOne({ _id: ObjectId.createFromHexString(game.id) }, game)
        return result.modifiedCount === 0? null: game
      })
    }
  }
}
