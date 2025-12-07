import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { rmSync } from "fs-extra";
import { getLogger } from "log4js";
import { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../database/schema.ts";

export type DisableReleaseCommand = {
	releaseId: string;
	db: BunSQLiteDatabase;
};

export type DisableReleaseResult = void;

const logger = getLogger("DisableReleaseCommand");

export default async function (command: DisableReleaseCommand): Promise<DisableReleaseResult> {
	const { releaseId, db } = command;

	const links = db
		.select()
		.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
		.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
		.all();

	for (const link of links) {
		if (link.installedPath) {
			try {
				rmSync(link.installedPath, { force: true, recursive: true });
				db.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
					.set({ installedPath: null })
					.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, link.id))
					.run();
			} catch (err) {
				logger.error(`Failed to remove symbolic link at ${link.installedPath}: ${err}`);
			}
		}
	}
}
