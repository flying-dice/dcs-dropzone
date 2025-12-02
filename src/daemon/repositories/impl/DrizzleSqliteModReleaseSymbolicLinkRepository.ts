import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../../database/schema.ts";
import type {
	ModReleaseSymbolicLinkRepository,
	ModReleaseSymbolicLinkRow,
} from "../ModReleaseSymbolicLinkRepository.ts";

export class DrizzleSqliteModReleaseSymbolicLinkRepository implements ModReleaseSymbolicLinkRepository {
	constructor(private readonly db: BunSQLiteDatabase) {}

	getByReleaseId(releaseId: string): ModReleaseSymbolicLinkRow[] {
		return this.db
			.select()
			.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
			.all();
	}

	setInstalledPath(id: string, installedPath: string | null): void {
		this.db
			.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.set({ installedPath })
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, id))
			.run();
	}
}
