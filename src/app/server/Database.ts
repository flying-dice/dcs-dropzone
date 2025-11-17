import { MongoInstance, MongoMemoryServer } from "mongodb-memory-server";
import * as mongoose from "mongoose";
import applicationConfig from "./ApplicationConfig.ts";
import Logger from "./Logger.ts";

const logger = Logger.getLogger("Database");

if (applicationConfig.mongoMemoryServer) {
	logger.info("Starting in-memory MongoDB server...");
	const mongod = await MongoMemoryServer.create({
		instance: { port: applicationConfig.mongoMemoryServerPort },
	});

	const mongoUri = mongod.getUri();
	logger.info(`In-memory MongoDB server started at ${mongoUri}`);
}

logger.info("Connecting to MongoDB...");

await mongoose.connect(applicationConfig.mongoUri);

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
