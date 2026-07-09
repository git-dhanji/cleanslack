import mongoose from "mongoose"

// Wisp uses MongoDB for ONE thing only: reserving connection codes so two
// people never collide on the same code. It stores just the code + a timestamp
// — never messages, files, or any identity. If the database is unreachable, the
// app still works (code checks fall back to the in-memory room cap).

const MONGODB_URI = process.env.MONGODB_URI

interface GlobalMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
  indexesSynced?: boolean
}

declare global {
  var myMongoose: GlobalMongoose | undefined
}

const cached: GlobalMongoose = global.myMongoose || { conn: null, promise: null }
if (!global.myMongoose) global.myMongoose = cached

async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set")
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Fail fast when there is no database, so the app can degrade gracefully.
      serverSelectionTimeoutMS: 2500,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  // MongoDB never alters an existing TTL index on its own, so a changed
  // `expires` in a schema would silently not apply. Sync once per process.
  if (!cached.indexesSynced) {
    cached.indexesSynced = true
    await Promise.all(
      Object.values(cached.conn.models).map((m) => m.syncIndexes().catch(() => {})),
    )
  }

  return cached.conn
}

export default dbConnect
