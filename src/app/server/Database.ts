import { MongoClient } from "mongodb";
import Logger from "./Logger.ts";

const logger = Logger.getLogger("Database");

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
	logger.debug("Pinging MongoDB");
	const result = await instance?.command({ ping: 1 }, { timeoutMS: 3000 });
	const ok = result?.ok === 1;
	logger.debug({ ok }, "MongoDB ping result");
	return ok;
}

export default {
	instance,
	ping,
};
