import { MongoUrl } from "common/MongoUrl";
import { getLogger } from "log4js";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongoose from "mongoose";
import applicationConfig from "./ApplicationConfig.ts";

const logger = getLogger("Database");

const mongoUrl = new MongoUrl(applicationConfig.mongoUri);

if (mongoUrl.isMemoryDatabase()) {
	logger.info(mongoUrl.toObject(), "Starting in-memory MongoDB server...");

	const mongod = await MongoMemoryServer.create({
		instance: {
			port: mongoUrl.port,
			dbName: mongoUrl.dbName,
		},
	});

	const mongoUri = mongod.getUri(mongoUrl.dbName);
	logger.info(`In-memory MongoDB server started at ${mongoUri}`);
	await mongoose.connect(mongoUri);
} else {
	logger.info("Connecting to MongoDB...");
	await mongoose.connect(applicationConfig.mongoUri);
}

logger.info("Connected to MongoDB.");

/**
 * Ping the database to check if the connection is alive.
 * @returns {Promise<boolean>} True if the ping was successful, false otherwise.
 */
async function ping(): Promise<boolean> {
	logger.debug("Pinging MongoDB");

	const result = await mongoose.connections[0]?.db?.command({ ping: 1 });
	const ok = result?.ok === 1;

	logger.debug({ ok }, "MongoDB ping result");
	return ok;
}

export default {
	ping,
};
