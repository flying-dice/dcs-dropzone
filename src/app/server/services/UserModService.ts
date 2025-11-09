import { Mod } from "../domain/Mod.ts";
import type { User } from "../domain/User.ts";
import { type ModDto, serializeMod, serializeMods } from "../dto/ModDto.ts";
import type { UserDto } from "../dto/UserDto.ts";
import { getLogger } from "../logger.ts";
import type { ModRepository } from "../repsotiory/ModRepository.ts";
import type { UserRepository } from "../repsotiory/UserRepository.ts";

export enum UserModServiceError {
	NotMaintainer = "NotMaintainer",
	NotFound = "NotFound",
	UserNotFound = "UserNotFound",
}

export class UserModService {
	private readonly logger = getLogger(UserModService.name);

	constructor(
		private readonly modRepository: ModRepository,
		private readonly userRepository: UserRepository,
		protected readonly user: UserDto,
	) {}

	async findAllUserMods(): Promise<ModDto[] | UserModServiceError> {
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const mods = await this.modRepository.getByMaintainer(user);

		return serializeMods(mods);
	}

	async findUserModById(modId: string): Promise<ModDto | UserModServiceError> {
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const mod = await this.modRepository.getById(modId);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(user)) {
			return UserModServiceError.NotMaintainer;
		}

		return serializeMod(mod);
	}

	async createMod(name: string): Promise<void | UserModServiceError> {
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const id = await this.modRepository.getNextId();

		const mod = Mod.default({
			id,
			name,
			maintainers: [user],
		});

		await this.modRepository.save(mod);
	}

	async updateMod(modDto: ModDto): Promise<undefined | UserModServiceError> {
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const mod = await this.modRepository.getById(modDto.id);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeUpdatedBy(user)) {
			return UserModServiceError.NotMaintainer;
		}

		const newMaintainers: User[] = [];

		for (const maintainerDto of modDto.maintainers) {
			const maintainer = await this.userRepository.getById(maintainerDto);
			if (maintainer) {
				newMaintainers.push(maintainer);
			} else {
				this.logger.error(
					`Maintainer with id '${maintainerDto}' not found while updating mod '${modDto.id}'`,
				);
			}
		}

		mod.updateProps({
			name: modDto.name,
			category: modDto.category,
			description: modDto.description,
			content: modDto.content,
			tags: modDto.tags,
			dependencies: modDto.dependencies,
			screenshots: modDto.screenshots,
			thumbnail: modDto.thumbnail,
			visibility: modDto.visibility,
			maintainers: newMaintainers,
		});

		await this.modRepository.save(mod);
	}

	async deleteMod(id: string): Promise<undefined | UserModServiceError> {
		const user = await this.userRepository.getById(this.user.id);

		if (!user) {
			return UserModServiceError.UserNotFound;
		}

		const mod = await this.modRepository.getById(id);

		if (!mod) {
			return UserModServiceError.NotFound;
		}

		if (!mod.canBeDeletedBy(user)) {
			return UserModServiceError.NotMaintainer;
		}

		await this.modRepository.delete(mod.id);
	}
}
