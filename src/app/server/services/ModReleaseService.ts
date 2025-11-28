import { getLogger } from "log4js";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModReleaseCreateData } from "../schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("ModReleaseService");

export enum ModReleaseServiceError {
	NOT_FOUND = "NOT_FOUND",
	MOD_NOT_FOUND = "MOD_NOT_FOUND",
}

export class ModReleaseService {
	constructor(protected readonly user: UserData) {}

	/**
	 * Find all releases for a user-owned mod (includes private releases)
	 */
	async findUserModReleases(
		modId: string,
	): Promise<ModReleaseData[] | ModReleaseServiceError> {
		logger.debug({ userId: this.user.id, modId }, "findUserModReleases start");

		const releases = await ModRelease.find({ mod_id: modId })
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		return ModReleaseData.array().parse(releases);
	}

	/**
	 * Find a specific release for a user-owned mod
	 */
	async findUserModReleaseById(
		modId: string,
		releaseId: string,
	): Promise<ModReleaseData | ModReleaseServiceError> {
		logger.debug(
			{ userId: this.user.id, modId, releaseId },
			"findUserModReleaseById start",
		);

		const release = await ModRelease.findOne({
			id: releaseId,
			mod_id: modId,
		})
			.lean()
			.exec();

		if (!release) {
			logger.debug({ releaseId }, "Release not found");
			return ModReleaseServiceError.NOT_FOUND;
		}

		return ModReleaseData.parse(release);
	}

	/**
	 * Create a new release for a user-owned mod
	 */
	async createRelease(
		modId: string,
		createData: ModReleaseCreateData,
	): Promise<ModReleaseData | ModReleaseServiceError> {
		logger.debug(
			{ userId: this.user.id, modId, createData },
			"createRelease start",
		);

		const id = crypto.randomUUID();

		const releaseData: ModReleaseData = {
			id,
			mod_id: modId,
			version: createData.version,
			changelog: "abc",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.PUBLIC,
		};

		const result = await ModRelease.create(ModReleaseData.parse(releaseData));
		logger.debug({ releaseId: id }, "User successfully created release");

		return ModReleaseData.parse(result);
	}

	/**
	 * Update an existing release
	 */
	async updateRelease(
		updateData: ModReleaseData,
	): Promise<undefined | ModReleaseServiceError> {
		logger.debug({ userId: this.user.id, updateData }, "updateRelease start");

		const release = await ModRelease.findOneAndUpdate(
			{ id: updateData.id, mod_id: updateData.mod_id },
			{
				version: updateData.version,
				changelog: updateData.changelog,
				assets: updateData.assets,
				symbolicLinks: updateData.symbolicLinks,
				visibility: updateData.visibility,
			},
		).exec();

		if (!release) {
			logger.warn(
				{ releaseId: updateData.id },
				"User attempted to update release but it was not found",
			);
			return ModReleaseServiceError.NOT_FOUND;
		}

		logger.debug(
			{ releaseId: updateData.id },
			"User successfully updated release",
		);
	}

	/**
	 * Delete a release
	 */
	async deleteRelease(
		modId: string,
		releaseId: string,
	): Promise<undefined | ModReleaseServiceError> {
		logger.debug(
			{ userId: this.user.id, modId, releaseId },
			"deleteRelease start",
		);

		const result = await ModRelease.findOneAndDelete({
			id: releaseId,
			mod_id: modId,
		}).exec();

		if (!result) {
			logger.warn(
				{ releaseId },
				"User attempted to delete release but it was not found",
			);
			return ModReleaseServiceError.NOT_FOUND;
		}

		logger.debug({ releaseId }, "User successfully deleted release");
	}
}

/**
 * Public service for accessing releases (no authentication required)
 */
export class PublicModReleaseService {
	/**
	 * Find all public releases for a mod
	 */
	async findPublicModReleases(modId: string): Promise<ModReleaseData[]> {
		logger.debug({ modId }, "findPublicModReleases start");

		const releases = await ModRelease.find({
			mod_id: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		return ModReleaseData.array().parse(releases);
	}

	/**
	 * Find a specific public release
	 */
	async findPublicModReleaseById(
		modId: string,
		releaseId: string,
	): Promise<ModReleaseData | ModReleaseServiceError> {
		logger.debug({ modId, releaseId }, "findPublicModReleaseById start");

		const release = await ModRelease.findOne({
			id: releaseId,
			mod_id: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.lean()
			.exec();

		if (!release) {
			logger.debug({ releaseId }, "Public release not found");
			return ModReleaseServiceError.NOT_FOUND;
		}

		return ModReleaseData.parse(release);
	}
}
