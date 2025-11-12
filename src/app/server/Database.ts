import * as mongoose from "mongoose";
import Logger from "./Logger.ts";

const logger = Logger.getLogger("Database");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"Please define the MONGODB_URI environment variable inside .env",
	);
}

logger.info("Connecting to MongoDB...");

await mongoose.connect(MONGODB_URI);

logger.info("Connected to MongoDB.");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
async function ping(): Promise<boolean> {
	logger.debug("Pinging MongoDB");

	const result = await mongoose.connection.db?.command({ ping: 1 });
	const ok = result?.ok === 1;

	logger.debug({ ok }, "MongoDB ping result");
	return ok;
}

export default {
	ping,
};
