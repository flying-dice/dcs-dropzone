import { type Db, MongoClient } from "mongodb";
import { getLogger } from "./logger.ts";

const logger = getLogger("db");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI envir#onment variable inside .env",
  );
}

logger.info("Connecting to MongoDB...");
const client: MongoClient = await MongoClient.connect(MONGODB_URI, {
  timeoutMS: 5000,
  connectTimeoutMS: 5000,
});

logger.info("Connected to MongoDB, starting database connection...");
const database: Db = client.db("dcs-dropzone-registry");

export const mods = database.collection("mods");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
async function ping(): Promise<boolean> {
  const result = await database.command({ ping: 1 }, { timeoutMS: 3000 });
  return result.ok === 1;
}

export const db = {
  mods,
  ping,
};
