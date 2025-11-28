import { drizzle } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import type { ApplicationConfig } from "../ApplicationConfig.ts";
import { AppDatabase } from "./app-database.ts";
import { ddlExports } from "./db-ddl.ts";

const logger = getLogger("db");

export const db = (config: ApplicationConfig["database"]) => {
	logger.debug("Compiling migrations...");

	const appDatabase = AppDatabase.withMigrations(config.url, ddlExports);

	return drizzle({
		client: appDatabase.getDatabase(),
		logger: {
			logQuery: (query: string, params: unknown[]) => {
				logger.debug({ query, params });
			},
		},
	});
};
