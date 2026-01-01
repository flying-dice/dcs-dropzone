import { drizzle } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { AppDatabase } from "./app-database.ts";
import { ddlExports } from "./db-ddl.ts";

const logger = getLogger("db");

export default (databaseUrl: string) => {
	logger.debug("Compiling migrations...");

	const appDatabase = AppDatabase.withMigrations(databaseUrl, ddlExports);

	return drizzle({
		client: appDatabase.getDatabase(),
		logger: {
			logQuery: (query: string, params: unknown[]) => {
				logger.debug({ query, params });
			},
		},
	});
};
