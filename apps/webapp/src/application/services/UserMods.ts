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

	async createMod(user: UserData, createData: ModCreateData): Promise<ModData> {
		logger.debug({ userId: user.id, createData }, "start");
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
		logger.debug({ modId: id }, "User successfully created mod");

		return ModData.parse(result);
	}

	async updateMod(
		user: UserData,
		updateData: ModUpdateData,
	): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId: updateData.id }, "updateMod start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.id);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateMod(updateData);
				if (!updated) {
					logger.warn({ modId: updateData.id }, "User attempted to update mod but it was not found");
					return err("ModNotFound");
				}
				logger.debug({ modId: updateData.id }, "User successfully updated mod");
				return ok(ModData.parse(updated));
			},
			(e) => err(e),
		);
	}

	async deleteMod(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId }, "deleteMod start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteMod(modId);
				if (!deleted) {
					logger.warn({ modId }, "User attempted to delete mod but it was not found");
					return err("ModNotFound");
				}
				logger.debug({ modId }, "User successfully deleted mod");
				return ok(ModData.parse(deleted));
			},
			(e) => err(e),
		);
	}

	async findById(user: UserData, modId: string): Promise<Result<ModData, "ModNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId }, "findById start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const mod = await this.deps.modRepository.findModById(modId);
				if (!mod) {
					logger.debug({ modId }, "User attempted to fetch mod but it was not found");
					return err("ModNotFound");
				}

				logger.debug({ modId }, "User successfully fetched mod");

				return ok(ModData.parse(mod));
			},
			(e) => err(e),
		);
	}

	async createRelease(
		user: UserData,
		createData: ModReleaseCreateData,
	): Promise<Result<ModReleaseData, "ModNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId: createData.modId }, "createRelease start");
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
				return ok(ModReleaseData.parse(result));
			},
			(e) => err(e),
		);
	}

	async updateRelease(
		user: UserData,
		updateData: ModReleaseUpdateData,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId: updateData.modId, releaseId: updateData.id }, "updateRelease start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, updateData.modId);
		return checkResult.match(
			async () => {
				const updated = await this.deps.modRepository.updateModRelease(
					ModReleaseUpdateData.parse({ ...updateData, versionHash: objectHash(Date.now()) }),
				);

				if (!updated) {
					logger.warn({ releaseId: updateData.id }, "User attempted to update release but it was not found");
					return err("ReleaseNotFound");
				}

				logger.debug({ releaseId: updateData.id }, "User successfully updated release");
				return ok(updated);
			},
			(e) => err(e),
		);
	}

	async deleteRelease(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId, releaseId }, "deleteRelease start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const deleted = await this.deps.modRepository.deleteModRelease(modId, releaseId);

				if (!deleted) {
					logger.warn({ releaseId }, "User attempted to delete release but it was not found");
					return err("ReleaseNotFound");
				}

				logger.debug({ releaseId }, "User successfully deleted release");

				return ok(deleted);
			},
			(e) => err(e),
		);
	}

	async findReleaseById(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId, releaseId }, "findReleaseById start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);

		return checkResult.match(
			async () => {
				const release = await this.deps.modRepository.findModReleaseById(modId, releaseId);

				if (!release) {
					logger.warn({ releaseId }, "User attempted to fetch release but it was not found");
					return err("ReleaseNotFound");
				}

				logger.debug({ releaseId }, "User successfully fetched release");

				return ok(ModReleaseData.parse(release));
			},
			(e) => err(e),
		);
	}

	async findReleases(
		user: UserData,
		modId: string,
	): Promise<Result<ModReleaseData[], "ModNotFound" | "NotMaintainer">> {
		logger.debug({ userId: user.id, modId }, "findUserModReleases start");
		const checkResult = await this.checkExistsAndUserAllowedToModify(user, modId);
		return checkResult.match(
			async () => {
				const releases = await this.deps.modRepository.findModReleasesByModId(modId);
				logger.debug({ modId }, "User successfully fetched mod releases");
				return ok(ModReleaseData.array().parse(releases));
			},
			(e) => err(e),
		);
	}

	async findAllMods(user: UserData): Promise<{
		data: ModSummaryData[];
		meta: UserModsMetaData;
	}> {
		logger.debug({ userId: user.id }, "findAllMods start");

		const mods = await this.deps.modRepository.findAllModsForMaintainerSortedByCreatedAtDesc(user.id);
		const countPublic = await this.deps.modRepository.getTotalPublicModsCountForMaintainer(user.id);
		const countDownloads = await this.deps.modRepository.getTotalDownloadsCountForMaintainer(user.id);

		logger.debug({ userId: user.id }, "User successfully fetched all mods");

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
			logger.warn({ modId, userId: user.id }, "User attempted to delete mod that does not exist");
			return err("ModNotFound");
		}

		if (!isMaintainer) {
			logger.warn({ modId, userId: user.id }, "User attempted to delete mod they do not maintain");
			return err("NotMaintainer");
		}

		return ok(true);
	}
}
