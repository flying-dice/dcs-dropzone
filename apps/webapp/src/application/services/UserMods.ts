import { getLogger } from "log4js";
import objectHash from "object-hash";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModNotFoundError, NotMaintainerError, ReleaseNotFoundError } from "../errors.ts";
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

	async updateMod(
		user: UserData,
		updateData: ModUpdateData,
	): Promise<[ModData, null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		logger.info("Updating mod", { userId: user.id, modId: updateData.id });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, updateData.id);
		if (checkErr) return [undefined, checkErr];

		const updated = await this.deps.modRepository.updateMod(updateData);
		if (!updated) {
			logger.warn("Mod update failed - not found", { modId: updateData.id, userId: user.id });
			return [undefined, new ModNotFoundError()];
		}
		logger.info("Mod updated successfully", { modId: updateData.id, userId: user.id });
		return [ModData.parse(updated), null];
	}

	async deleteMod(
		user: UserData,
		modId: string,
	): Promise<[ModData, null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		logger.info("Deleting mod", { userId: user.id, modId });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, modId);
		if (checkErr) return [undefined, checkErr];

		const deleted = await this.deps.modRepository.deleteMod(modId);
		if (!deleted) {
			logger.warn("Mod deletion failed - not found", { modId, userId: user.id });
			return [undefined, new ModNotFoundError()];
		}
		logger.info("Mod deleted successfully", { modId, userId: user.id, modName: deleted.name });
		return [ModData.parse(deleted), null];
	}

	async findById(
		user: UserData,
		modId: string,
	): Promise<[ModData, null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		logger.debug("Fetching user mod", { userId: user.id, modId });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, modId);
		if (checkErr) return [undefined, checkErr];

		const mod = await this.deps.modRepository.findModById(modId);
		if (!mod) {
			logger.debug("Mod not found for user", { modId, userId: user.id });
			return [undefined, new ModNotFoundError()];
		}

		logger.debug("User mod fetched", { modId, userId: user.id });
		return [ModData.parse(mod), null];
	}

	async createRelease(
		user: UserData,
		createData: ModReleaseCreateData,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		logger.info("Creating release", { userId: user.id, modId: createData.modId, version: createData.version });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, createData.modId);
		if (checkErr) return [undefined, checkErr];

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
		return [ModReleaseData.parse(result), null];
	}

	async updateRelease(
		user: UserData,
		updateData: ModReleaseUpdateData,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | ReleaseNotFoundError | NotMaintainerError]> {
		logger.info("Updating release", { userId: user.id, modId: updateData.modId, releaseId: updateData.id });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, updateData.modId);
		if (checkErr) return [undefined, checkErr];

		const updated = await this.deps.modRepository.updateModRelease(
			ModReleaseUpdateData.parse({ ...updateData, versionHash: objectHash(Date.now()) }),
		);

		if (!updated) {
			logger.warn("Release update failed - not found", { releaseId: updateData.id, userId: user.id });
			return [undefined, new ReleaseNotFoundError()];
		}

		logger.info("Release updated successfully", { releaseId: updateData.id, modId: updateData.modId });
		return [updated, null];
	}

	async deleteRelease(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | ReleaseNotFoundError | NotMaintainerError]> {
		logger.info("Deleting release", { userId: user.id, modId, releaseId });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, modId);
		if (checkErr) return [undefined, checkErr];

		const deleted = await this.deps.modRepository.deleteModRelease(modId, releaseId);

		if (!deleted) {
			logger.warn("Release deletion failed - not found", { releaseId, modId, userId: user.id });
			return [undefined, new ReleaseNotFoundError()];
		}

		logger.info("Release deleted successfully", { releaseId, modId, version: deleted.version });
		return [deleted, null];
	}

	async findReleaseById(
		user: UserData,
		modId: string,
		releaseId: string,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | ReleaseNotFoundError | NotMaintainerError]> {
		logger.debug("Fetching release", { userId: user.id, modId, releaseId });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, modId);
		if (checkErr) return [undefined, checkErr];

		const release = await this.deps.modRepository.findModReleaseById(modId, releaseId);

		if (!release) {
			logger.debug("Release not found for user", { releaseId, modId, userId: user.id });
			return [undefined, new ReleaseNotFoundError()];
		}

		logger.debug("Release fetched", { releaseId, modId });
		return [ModReleaseData.parse(release), null];
	}

	async findReleases(
		user: UserData,
		modId: string,
	): Promise<[ModReleaseData[], null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		logger.debug("Fetching mod releases", { userId: user.id, modId });
		const [, checkErr] = await this.checkExistsAndUserAllowedToModify(user, modId);
		if (checkErr) return [undefined, checkErr];

		const releases = await this.deps.modRepository.findModReleasesByModId(modId);
		logger.info("Releases fetched for mod", { modId, count: releases.length });
		return [ModReleaseData.array().parse(releases), null];
	}

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
	): Promise<[true, null] | [undefined, ModNotFoundError | NotMaintainerError]> {
		const isMaintainer = await this.deps.modRepository.isMaintainerForMod(user.id, modId);
		if (isMaintainer === undefined) {
			logger.warn("Access denied - mod not found", { modId, userId: user.id });
			return [undefined, new ModNotFoundError()];
		}

		if (!isMaintainer) {
			logger.warn("Access denied - not maintainer", { modId, userId: user.id });
			return [undefined, new NotMaintainerError()];
		}

		return [true, null];
	}
}
