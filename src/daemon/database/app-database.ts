import { Database, type Statement } from "bun:sqlite";
import { getLogger } from "log4js";
import { AppDatabaseMigration } from "./app-database-migration";

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

export class AppDatabase {
	protected logger = getLogger(AppDatabase.name);

	protected readonly db: Database;

	protected readonly migrationsDml: Statement<
		void,
		[
			{
				filename: string;
				hash: string;
			},
		]
	>;

	protected readonly migrationsDql: Statement<
		{
			count: number;
		},
		[
			{
				filename: string;
				hash: string;
			},
		]
	>;

	constructor(
		protected readonly filename: string,
		protected readonly migrations: AppDatabaseMigration[],
	) {
		this.db = new Database(filename, { create: true, strict: true });
		this.db.run(MIGRATIONS_DDL);

		// Prepare the migration DML statement (INSERT)
		this.migrationsDml = this.db.prepare(MIGRATIONS_DML);

		// Prepare the migration DQL statement (SELECT)
		this.migrationsDql = this.db.prepare(MIGRATIONS_DQL);

		// Prepare the transaction for applying migrations
		const applyMigration = this.db.transaction((it: AppDatabaseMigration) => {
			this.logger.debug(`Applying migration ${it.filename}`);
			this.db.run(it.sql);
			this.migrationsDml.run({ filename: it.filename, hash: it.hash });
		});

		for (const migration of this.migrations) {
			this.logger.debug(`Checking migration ${migration.filename}`);
			if (this.isMigrationApplied(migration)) {
				this.logger.debug(`Migration ${migration.filename} already applied, skipping`);
				continue;
			}
			applyMigration(migration);
		}

		this.logger.debug(`Applied ${this.migrations.length} migration files`);
	}

	getDatabase(): Database {
		return this.db;
	}

	private isMigrationApplied(migration: AppDatabaseMigration): boolean {
		return (
			(this.migrationsDql.get({
				filename: migration.filename,
				hash: migration.hash,
			})?.count ?? 0) > 0
		);
	}

	/**
	 * Create an AppDatabase instance with migrations from a Record<string, string> object.
	 *
	 * The keys are the filenames and the values are the SQL statements.
	 *
	 * @param filename {string} - The database filename.
	 * @param migrations {Record<string, string>} - The migrations as a record of filename to SQL.
	 * @returns {AppDatabase} - The AppDatabase instance.
	 */
	static withMigrations(filename: string, migrations: Record<string, string>): AppDatabase {
		const _migrations: AppDatabaseMigration[] = Object.entries(migrations).map(
			([filename, sql]) => new AppDatabaseMigration(filename, sql),
		);

		const appDatabase = new AppDatabase(filename, _migrations);

		return appDatabase;
	}
}
