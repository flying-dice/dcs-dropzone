import { subSeconds } from "date-fns";
import { getLogger } from "log4js";
import type { RootFilterQuery } from "mongoose";
import { Migration, MigrationStatus } from "../entities/Migration.ts";

const logger = getLogger("MigrationService");

export class MigrationService {
	private static readonly MAX_AGE_SECONDS = 30;

	private readonly migrationId: string;
	private readonly serviceId: string;

	private readonly migrationFunction: () => Promise<void>;

	get context() {
		return {
			migrationId: this.migrationId,
			serviceId: this.serviceId,
		};
	}

	protected constructor(id: string, migration: () => Promise<void>, serviceId: string) {
		this.migrationId = id;
		this.serviceId = serviceId;
		this.migrationFunction = migration;
	}

	static async runMigration(id: string, migration: () => Promise<void>) {
		logger.info(`Starting migration (${id})...`);
		const service = new MigrationService(id, migration, crypto.randomUUID());
		await service.run();
	}

	private async run(): Promise<void> {
		await this.ensureExists();

		if (await this.isCompleted()) {
			logger.info(this.context, "Migration already completed, skipping.");
			return;
		}

		logger.info(this.context, "Acquiring lock for migration");

		const lock = await this.acquireLock();

		if (!lock) {
			logger.error(
				this.context,
				`Failed to acquire lock for migration ${this.migrationId}, another instance may be running.`,
			);
			throw new Error("ERR: failed to lock");
		}

		logger.info(this.context, "Lock acquired, starting migration");

		try {
			await this.migrationFunction();
			logger.info(this.context, "Migration completed successfully, marking as complete.");
			await this.complete();
		} catch (error) {
			logger.error(this.context, `Migration failed with error: ${error}, marking as failed.`);
			await this.fail(error?.toString() || "Unknown error");
		}
	}

	private async ensureExists(): Promise<void> {
		await Migration.create({
			id: this.migrationId,
			status: MigrationStatus.PENDING,
			startedBy: this.serviceId,
		}).catch((err: Error) => {
			if (err.message.includes("E11000")) {
				return;
			}
			throw err;
		});
	}

	private async isCompleted(): Promise<boolean> {
		return (
			(await Migration.exists({
				id: this.migrationId,
				status: MigrationStatus.COMPLETED,
			}).exec()) !== null
		);
	}

	private async complete(): Promise<void> {
		await Migration.findOneAndUpdate(
			{
				id: this.migrationId,
				status: MigrationStatus.RUNNING,
				startedBy: this.serviceId,
			},
			{
				status: MigrationStatus.COMPLETED,
			},
		)
			.exec()
			.then((it) => it || Promise.reject(`Failed to mark migration ${this.migrationId} as complete`));
	}

	private async fail(error: string): Promise<void> {
		await Migration.findOneAndUpdate(
			{
				id: this.migrationId,
				status: MigrationStatus.RUNNING,
				startedBy: this.serviceId,
			},
			{
				status: MigrationStatus.FAILED,
				error,
			},
		)
			.exec()
			.then((it) => it || Promise.reject(`Failed to mark migration ${this.migrationId} as failed`));
	}

	private async acquireLock(): Promise<Migration | null> {
		const pendingFilter: RootFilterQuery<Migration> = {
			id: this.migrationId,
			status: MigrationStatus.PENDING,
		};

		const staleFilter: RootFilterQuery<Migration> = {
			id: this.migrationId,
			status: MigrationStatus.RUNNING,
			startedAt: {
				$lt: subSeconds(new Date(), MigrationService.MAX_AGE_SECONDS),
			},
		};

		const failedFilter: RootFilterQuery<Migration> = {
			id: this.migrationId,
			status: MigrationStatus.FAILED,
		};

		return await Migration.findOneAndUpdate(
			{ $or: [pendingFilter, staleFilter, failedFilter] },
			{
				status: MigrationStatus.RUNNING,
				startedBy: this.serviceId,
				startedAt: new Date(),
			},
			{ new: true },
		).exec();
	}
}
