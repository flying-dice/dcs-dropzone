import { drizzle } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { AppDatabase } from "./app-database.ts";
import { ddlExports } from "./db-ddl.ts";

const logger = getLogger("db");

export default (databaseUrl: string, abortSignal?: AbortSignal) => {
	logger.debug("Compiling migrations...");

	const appDatabase = AppDatabase.withMigrations(databaseUrl, ddlExports);

	abortSignal?.addEventListener("abort", () => {
		logger.info("Abort signal received, closing database connection...");
		appDatabase.close();
	});

	return {
		db: drizzle({
			client: appDatabase.getDatabase(),
			logger: {
				logQuery: (query: string, params: unknown[]) => {
					logger.debug({ query, params });
				},
			},
		}),
		appDatabase,
	};
};
