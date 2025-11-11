import { Mod } from "../domain/Mod.ts";
import Logger from "../Logger.ts";
import type { ModRepository } from "../repository/ModRepository.ts";
import type { UserRepository } from "../repository/UserRepository.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = Logger.getLogger("UserModService");

export enum UserModServiceError {
	NotMaintainer = "NotMaintainer",
	NotFound = "NotFound",
	UserNotFound = "UserNotFound",
}

export class UserModService {
	constructor(
		private readonly modRepository: ModRepository,
		private readonly userRepository: UserRepository,
		protected readonly user: UserData,
	) {}

	async findAllUserMods(): Promise<ModData[] | UserModServiceError> {
		logger.debug({ userId: this.user.id }, "findAllUserMods start");
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			logger.warn(
				{ userId: this.user.id },
				"User not found when fetching all user mods",
			);
			return UserModServiceError.UserNotFound;
		}

		const mods = await this.modRepository.getByMaintainer(user);

		logger.debug(
			{ userId: this.user.id, modCount: mods.length },
			"User mods fetched",
		);
		return mods.map((it) => it.toData());
	}

	async findUserModById(modId: string): Promise<ModData | UserModServiceError> {
		logger.debug({ userId: this.user.id, modId }, "findUserModById start");
		const mod = await this.modRepository.getById(modId);

		if (!mod) {
			logger.debug(
				{ modId },
				"User attempted to fetch mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(this.user.id)) {
			logger.warn(
				{ userId: this.user.id, modId },
				"User attempted to fetch mod but is not a maintainer",
			);
			return UserModServiceError.NotMaintainer;
		}

		logger.debug({ modId }, "User successfully fetched mod");
		return mod.toData();
	}

	async createMod(name: string): Promise<ModData | UserModServiceError> {
		logger.debug({ userId: this.user.id, name }, "createMod start");
		const id = await this.modRepository.getNextId();

		const mod = Mod.default({
			id,
			name,
			maintainers: [this.user.id],
		});

		await this.modRepository.save(mod);
		logger.debug({ modId: id }, "User successfully created mod");

		return mod.toData();
	}

	async updateMod(modData: ModData): Promise<undefined | UserModServiceError> {
		logger.debug(
			{ userId: this.user.id, modId: modData.id },
			"updateMod start",
		);
		const mod = await this.modRepository.getById(modData.id);

		if (!mod) {
			logger.warn(
				{ modId: modData.id },
				"User attempted to update mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(this.user.id)) {
			logger.warn(
				{ userId: this.user.id, modId: modData.id },
				"User attempted to update mod but is not a maintainer",
			);
			return UserModServiceError.NotMaintainer;
		}

		for (const maintainerId of modData.maintainers) {
			const maintainer = await this.userRepository.getById(maintainerId);
			if (!maintainer) {
				logger.warn(
					{ maintainerId },
					"User attempted to add non-existent user as maintainer",
				);
				return UserModServiceError.UserNotFound;
			}
		}

		mod.updateProps({
			name: modData.name,
			category: modData.category,
			description: modData.description,
			content: modData.content,
			tags: modData.tags,
			dependencies: modData.dependencies,
			screenshots: modData.screenshots,
			thumbnail: modData.thumbnail,
			visibility: modData.visibility,
			maintainers: modData.maintainers,
		});

		await this.modRepository.save(mod);
		logger.debug({ modId: modData.id }, "User successfully updated mod");
	}

	async deleteMod(id: string): Promise<undefined | UserModServiceError> {
		logger.debug({ userId: this.user.id, modId: id }, "deleteMod start");
		const mod = await this.modRepository.getById(id);

		if (!mod) {
			logger.warn(
				{ modId: id },
				"User attempted to delete mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeDeletedBy(this.user.id)) {
			logger.warn(
				{ userId: this.user.id, modId: id },
				"User attempted to delete mod but is not a maintainer",
			);
			return UserModServiceError.NotMaintainer;
		}

		await this.modRepository.delete(mod.id);
		logger.debug({ modId: id }, "User successfully deleted mod");
	}
}
