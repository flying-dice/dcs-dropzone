import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { ensureSymlinkSync } from "fs-extra";
import { getLogger } from "log4js";
import { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../database/schema.ts";
import { getSymlinkType } from "../functions/getSymlinkType.ts";
import type { PathService } from "../services/PathService.ts";

export type EnableReleaseCommand = {
	releaseId: string;
	db: BunSQLiteDatabase;
	pathService: PathService;
};

export type EnableReleaseResult = void;

const logger = getLogger("EnableReleaseCommand");

export default async function (command: EnableReleaseCommand): Promise<EnableReleaseResult> {
	const { releaseId, db, pathService } = command;

	const links = db
		.select()
		.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
		.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
		.all();

	for (const link of links) {
		const srcAbs = pathService.getAbsoluteReleasePath(releaseId, link.src);

		const destAbs = pathService.getAbsoluteSymbolicLinkDestPath(link.destRoot, link.dest);

		const type = getSymlinkType(srcAbs);
		logger.debug(`Creating symlink from ${srcAbs} to ${destAbs} with type ${type}`);
		ensureSymlinkSync(srcAbs, destAbs, type);
		db.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.set({ installedPath: destAbs })
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, link.id))
			.run();
	}
}
