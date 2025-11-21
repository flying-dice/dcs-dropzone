import { drizzle } from "drizzle-orm/bun-sqlite";
import appConfig from "../app-config.ts";
import { getLogger } from "../Logger.ts";
import { AppDatabase } from "./app-database.ts";
import { AppDatabaseMigration } from "./app-database-migration.ts";
import { ddlExports } from "./db-ddl.ts";

const logger = getLogger("db");

logger.debug("Compiling migrations...");
const migrations: AppDatabaseMigration[] = Object.entries(ddlExports).map(
	([filename, sql]) => new AppDatabaseMigration(filename, sql),
);

const appDatabase = new AppDatabase(appConfig.database.url, migrations);

export const db = drizzle({
	client: appDatabase.getDatabase(),
	logger: {
		logQuery: (query: string, params: unknown[]) => {
			logger.debug({ query, params });
		},
	},
});
