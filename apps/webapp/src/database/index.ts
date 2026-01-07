import { getLogger } from "log4js";
import * as mongoose from "mongoose";
import { ModReleaseMigrations } from "./entities/ModRelease.ts";
import { ModSummaryMigrations } from "./entities/ModSummary.ts";

const logger = getLogger("Database");

export async function applyDatabaseMigrations() {
	for (const migration of [...ModSummaryMigrations, ...ModReleaseMigrations]) {
		logger.debug({ migrationId: migration.migrationId }, "Applying migration...");
		await migration.run();
		logger.debug({ migrationId: migration.migrationId }, "Migration applied.");
	}
}

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
