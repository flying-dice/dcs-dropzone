import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import objectHash from "object-hash";
import { ModVisibility } from "../enums/ModVisibility.ts";
import type { ModRepository } from "../ports/ModRepository.ts";
import type { UUIDGenerator } from "../ports/UUIDGenerator.ts";
import type { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";
import type { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import { ModReleaseUpdateData } from "../schemas/ModReleaseUpdateData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { ModUpdateData } from "../schemas/ModUpdateData.ts";
import type { UserData } from "../schemas/UserData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const logger = getLogger("UserMods");

type Deps = {
	modRepository: ModRepository;
	generateUuid: UUIDGenerator;
};

export class UserMods {
	constructor(private readonly deps: Deps) {}

	@Log(logger)
	async createMod(user: UserData, createData: ModCreateData): Promise<ModData> {
		logger.info("Creating mod", { userId: user.id, modName: createData.name, category: createData.category });
		const id = this.deps.generateUuid();

		const modData: ModData = {
			id,
			name: createData.name,
			category: createData.category,
			description: createData.description,
			thumbnail: "https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
			screenshots: [],
			content: "Add your mod content here.",
			tags: [],
			dependencies: [],
			visibility: ModVisibility.PRIVATE,
			maintainers: [user.id],
			downloadsCount: 0,
		};

		const result = await this.deps.modRepository.createMod(ModData.parse(modData));
		logger.info("Mod created successfully", { modId: id, userId: user.id, modName: createData.name });

		return ModData.parse(result);
	}

	@Log(logger)
	async updateMod(
		user: UserData,
		updateData: ModUpdateData,
	): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.info("Updating mod", { userId: user.id, modId: updateData.id });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.id);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateMod(updateData);
				if (!updated) {
					logger.warn("Mod update failed - not found", { modId: updateData.id, userId: user.id });
					return err("ModNotFound");
				}
				logger.info("Mod updated successfully", { modId: updateData.id, userId: user.id });
				return ok(ModData.parse(updated));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async deleteMod(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.info("Deleting mod", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteMod(modId);
				if (!deleted) {
					logger.warn("Mod deletion failed - not found", { modId, userId: user.id });
					return err("ModNotFound");
				}
				logger.info("Mod deleted successfully", { modId, userId: user.id, modName: deleted.name });
				return ok(ModData.parse(deleted));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async findById(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.debug("Fetching user mod", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const mod = await this.deps.modRepository.findModById(modId);
				if (!mod) {
					logger.debug("Mod not found for user", { modId, userId: user.id });
					return err("ModNotFound");
				}

				logger.debug("User mod fetched", { modId, userId: user.id });

				return ok(ModData.parse(mod));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async createRelease(
		user: UserData,
		createData: ModReleaseCreateData,
	): Promise<Result<ModReleaseData, "ModNotFound" | "NotMaintainer">> {
		logger.info("Creating release", { userId: user.id, modId: createData.modId, version: createData.version });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, createData.modId);
		return checkResult.match(
			async () => {
				const id = this.deps.generateUuid();
				const releaseData: ModReleaseData = {
					id,
					modId: createData.modId,
					version: createData.version,
					versionHash: objectHash(Date.now()),
					changelog: "Describe changes since last version...",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
					visibility: ModVisibility.PUBLIC,
					downloadsCount: 0,
				};

				const result = await this.deps.modRepository.createModRelease(ModReleaseData.parse(releaseData));
				logger.info("Release created successfully", {
					releaseId: id,
					modId: createData.modId,
					version: createData.version,
				});
				return ok(ModReleaseData.parse(result));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async updateRelease(
		user: UserData,
		updateData: ModReleaseUpdateData,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.info("Updating release", { userId: user.id, modId: updateData.modId, releaseId: updateData.id });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.modId);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateModRelease(
					ModReleaseUpdateData.parse({ ...updateData, versionHash: objectHash(Date.now()) }),
				);

				if (!updated) {
					logger.warn("Release update failed - not found", { releaseId: updateData.id, userId: user.id });
					return err("ReleaseNotFound");
				}

				logger.info("Release updated successfully", { releaseId: updateData.id, modId: updateData.modId });
				return ok(updated);
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async deleteRelease(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.info("Deleting release", { userId: user.id, modId, releaseId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteModRelease(modId, releaseId);

				if (!deleted) {
					logger.warn("Release deletion failed - not found", { releaseId, modId, userId: user.id });
					return err("ReleaseNotFound");
				}

				logger.info("Release deleted successfully", { releaseId, modId, version: deleted.version });

				return ok(deleted);
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async findReleaseById(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.debug("Fetching release", { userId: user.id, modId, releaseId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const release = await this.deps.modRepository.findModReleaseById(modId, releaseId);

				if (!release) {
					logger.debug("Release not found for user", { releaseId, modId, userId: user.id });
					return err("ReleaseNotFound");
				}

				logger.debug("Release fetched", { releaseId, modId });

				return ok(ModReleaseData.parse(release));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async findReleases(
		user: UserData,
		modId: string,
	): Promise<Result<ModReleaseData[], "ModNotFound" | "NotMaintainer">> {
		logger.debug("Fetching mod releases", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const releases = await this.deps.modRepository.findModReleasesByModId(modId);
				logger.info("Releases fetched for mod", { modId, count: releases.length });
				return ok(ModReleaseData.array().parse(releases));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async findAllMods(user: UserData): Promise<{
		data: ModSummaryData[];
		meta: UserModsMetaData;
	}> {
		logger.debug("Fetching all user mods", { userId: user.id });

		const mods = await this.deps.modRepository.findAllModsForMaintainerSortedByCreatedAtDesc(user.id);
		const countPublic = await this.deps.modRepository.getTotalPublicModsCountForMaintainer(user.id);
		const countDownloads = await this.deps.modRepository.getTotalDownloadsCountForMaintainer(user.id);

		logger.info("User mods fetched", {
			userId: user.id,
			totalMods: mods.length,
			publicMods: countPublic,
			totalDownloads: countDownloads,
		});

		return {
			data: ModSummaryData.array().parse(mods),
			meta: UserModsMetaData.parse({
				published: countPublic,
				totalDownloads: countDownloads,
			}),
		};
	}

	private async checkExistsAndUserAllowedToModify(
		user: UserData,
		modId: string,
	): Promise<Result<true, "ModNotFound" | "NotMaintainer">> {
		const isMaintainer = await this.deps.modRepository.isMaintainerForMod(user.id, modId);
		if (isMaintainer === undefined) {
			logger.warn("Access denied - mod not found", { modId, userId: user.id });
			return err("ModNotFound");
		}

		if (!isMaintainer) {
			logger.warn("Access denied - not maintainer", { modId, userId: user.id });
			return err("NotMaintainer");
		}

		return ok(true);
	}
}
