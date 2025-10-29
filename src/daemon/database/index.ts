import type { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import objectHash from "object-hash";
import appConfig from "../app-config.ts";
import { getLogger } from "../logger.ts";
import { databaseFactory } from "./factory.ts";
import { ddlExports } from "./db-ddl.ts";
import type { Logger } from "drizzle-orm";

const logger = getLogger("db");

const MIGRATIONS_DDL = `
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations"
    (ó
        id         SERIAL PRIMARY KEY,
        filename   text NOT NULL,
        hash       text NOT NULL,
        created_at datetime default current_timestamp
    )
`;

const MIGRATIONS_DML = `INSERT INTO "__drizzle_migrations" (filename, hash) VALUES ($filename, $hash);`;

const MIGRATIONS_DQL = `SELECT count(hash) as count FROM "__drizzle_migrations" WHERE hash = $hash`;

const sqlite: Database = databaseFactory({
  filename: appConfig.database.url,
});

sqlite.exec(MIGRATIONS_DDL);

logger.trace("Preparing migration DML...");
const migrationsDml = sqlite.prepare<void, { filename: string; hash: string }>(
  MIGRATIONS_DML,
);

logger.trace("Preparing migration DQL...");
const migrationsDql = sqlite.prepare<
  { count: number },
  { filename: string; hash: string }
>(MIGRATIONS_DQL);

function isMigrationApplied(filename: string, hash: string): boolean {
  return (migrationsDql.get({ filename, hash })?.count ?? 0) > 0;
}

const applyMigration = sqlite.transaction(
  async (it: { filename: string; ddl: string; hash: string }) => {
    logger.debug(it, "Applying migration %s", it.filename);
    sqlite.exec(it.ddl);
    migrationsDml.run({ filename: it.filename, hash: it.hash });
  },
);

logger.debug("Compiling migrations...");
const files = Object.entries(ddlExports).map(([filename, ddl]) => ({
  filename,
  ddl,
  hash: objectHash(ddl, { algorithm: "sha256" }),
}));

logger.debug(
  { count: files.length },
  "Found %d migration files to apply",
  files.length,
);
for (const file of files) {
  logger.debug(file, "Checking migration %s", file.hash);
  if (isMigrationApplied(file.filename, file.hash)) {
    logger.debug(file, "Migration %s already applied, skipping", file.hash);
    continue;
  }
  logger.debug(file, "Applying migration %s", file.hash);
  await applyMigration(file);
}

class PinoLogger implements Logger {
  protected readonly logger = getLogger("drizzle");

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug({ query, params });
  }
}

export const db = drizzle({ client: sqlite, logger: new PinoLogger() });

export function serialize() {
  logger.debug("Exporting database to file...");
  return sqlite.serialize();
}
