import { Database } from "bun:sqlite";
import { getLogger } from "../logger.ts";

const logger = getLogger("DatabaseFactory");

export type DatabaseFactory<ARGS = any[]> = (args: ARGS) => Database;
/**
 * Creates or opens a SQLite database file. If the file does not exist, it will be created.
 * The database is opened in read-write mode and changes are persisted to the file.
 *
 * This is used for persistent storage of application data mostly in development mode.
 */
export function fileDatabaseFactory(filename: string): Database {
  logger.info({ filename }, "Opening database file...");
  return new Database(filename, { create: true, strict: true });
}

export type DatabaseFactoryProps = {
  filename: string;
};
export function databaseFactory(props: DatabaseFactoryProps): Database {
  return fileDatabaseFactory(props.filename);
}
