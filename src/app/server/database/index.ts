import * as mongoose from "mongoose";
import { getLogger } from "../logger.ts";

const logger = getLogger("db");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"Please define the MONGODB_URI environment variable inside .env",
	);
}

logger.info("Connecting to MongoDB...");

await mongoose.connect(MONGODB_URI, {
	timeoutMS: 5000,
	connectTimeoutMS: 5000,
});

logger.info("Connected to MongoDB.");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
export async function ping(): Promise<boolean> {
	const result = await mongoose.connection.db?.command(
		{ ping: 1 },
		{ timeoutMS: 3000 },
	);
	return result?.ok === 1;
}
