import { Mod } from "../domain/Mod.ts";
import type { ModRepository } from "../repsotiory/ModRepository.ts";
import type { UserRepository } from "../repsotiory/UserRepository.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { UserData } from "../schemas/UserData.ts";

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
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const mods = await this.modRepository.getByMaintainer(user);

		return mods.map((it) => it.toData());
	}

	async findUserModById(modId: string): Promise<ModData | UserModServiceError> {
		const mod = await this.modRepository.getById(modId);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(this.user.id)) {
			return UserModServiceError.NotMaintainer;
		}

		return mod.toData();
	}

	async createMod(name: string): Promise<void | UserModServiceError> {
		const id = await this.modRepository.getNextId();

		const mod = Mod.default({
			id,
			name,
			maintainers: [this.user.id],
		});

		await this.modRepository.save(mod);
	}

	async updateMod(modData: ModData): Promise<undefined | UserModServiceError> {
		const mod = await this.modRepository.getById(modData.id);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(this.user.id)) {
			return UserModServiceError.NotMaintainer;
		}

		for (const maintainerId of modData.maintainers) {
			const maintainer = await this.userRepository.getById(maintainerId);
			if (!maintainer) {
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
	}

	async deleteMod(id: string): Promise<undefined | UserModServiceError> {
		const mod = await this.modRepository.getById(id);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeDeletedBy(this.user.id)) {
			return UserModServiceError.NotMaintainer;
		}

		await this.modRepository.delete(mod.id);
	}
}
