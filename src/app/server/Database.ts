import { MongoClient } from "mongodb";
import Logger from "./Logger.ts";

const logger = Logger.getLogger("db");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"Please define the MONGODB_URI environment variable inside .env",
	);
}

logger.info("Connecting to MongoDB...");

const client = new MongoClient(MONGODB_URI);
const instance = client.db();

logger.info("Connected to MongoDB.");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
async function ping(): Promise<boolean> {
	const result = await instance?.command({ ping: 1 }, { timeoutMS: 3000 });
	return result?.ok === 1;
}

export default {
	instance,
	ping,
};
