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
		logger.info("createMod start", { userId: user.id, createData });
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
		logger.info("User successfully created mod", { modId: id });

		return ModData.parse(result);
	}

	@Log(logger)
	async updateMod(
		user: UserData,
		updateData: ModUpdateData,
	): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.info("updateMod start", { userId: user.id, modId: updateData.id });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.id);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateMod(updateData);
				if (!updated) {
					logger.warn("User attempted to update mod but it was not found", { modId: updateData.id });
					return err("ModNotFound");
				}
				logger.info("User successfully updated mod", { modId: updateData.id });
				return ok(ModData.parse(updated));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async deleteMod(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.info("deleteMod start", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteMod(modId);
				if (!deleted) {
					logger.warn("User attempted to delete mod but it was not found", { modId });
					return err("ModNotFound");
				}
				logger.info("User successfully deleted mod", { modId });
				return ok(ModData.parse(deleted));
			},
			(e) => err(e),
		);
	}

	@Log(logger)
	async findById(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.info("findById start", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const mod = await this.deps.modRepository.findModById(modId);
				if (!mod) {
					logger.warn("User attempted to fetch mod but it was not found", { modId });
					return err("ModNotFound");
				}

				logger.info("User successfully fetched mod", { modId });

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
		logger.info("createRelease start", { userId: user.id, modId: createData.modId });
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
				logger.info("User successfully created mod release", { releaseId: id });
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
		logger.info("updateRelease start", { userId: user.id, modId: updateData.modId, releaseId: updateData.id });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.modId);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateModRelease(
					ModReleaseUpdateData.parse({ ...updateData, versionHash: objectHash(Date.now()) }),
				);

				if (!updated) {
					logger.warn("User attempted to update release but it was not found", { releaseId: updateData.id });
					return err("ReleaseNotFound");
				}

				logger.info("User successfully updated release", { releaseId: updateData.id });
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
		logger.info("deleteRelease start", { userId: user.id, modId, releaseId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteModRelease(modId, releaseId);

				if (!deleted) {
					logger.warn("User attempted to delete release but it was not found", { releaseId });
					return err("ReleaseNotFound");
				}

				logger.info("User successfully deleted release", { releaseId });

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
		logger.info("findReleaseById start", { userId: user.id, modId, releaseId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const release = await this.deps.modRepository.findModReleaseById(modId, releaseId);

				if (!release) {
					logger.warn("User attempted to fetch release but it was not found", { releaseId });
					return err("ReleaseNotFound");
				}

				logger.info("User successfully fetched release", { releaseId });

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
		logger.info("findUserModReleases start", { userId: user.id, modId });
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const releases = await this.deps.modRepository.findModReleasesByModId(modId);
				logger.info("User successfully fetched mod releases", { modId });
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
		logger.info("findAllMods start", { userId: user.id });

		const mods = await this.deps.modRepository.findAllModsForMaintainerSortedByCreatedAtDesc(user.id);
		const countPublic = await this.deps.modRepository.getTotalPublicModsCountForMaintainer(user.id);
		const countDownloads = await this.deps.modRepository.getTotalDownloadsCountForMaintainer(user.id);

		logger.info("User successfully fetched all mods", { userId: user.id });

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
			logger.warn("User attempted to delete mod that does not exist", { modId, userId: user.id });
			return err("ModNotFound");
		}

		if (!isMaintainer) {
			logger.warn("User attempted to delete mod they do not maintain", { modId, userId: user.id });
			return err("NotMaintainer");
		}

		return ok(true);
	}
}
