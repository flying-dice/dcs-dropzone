import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import Logger from "../Logger.ts";
import type { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { UserData } from "../schemas/UserData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const logger = Logger.getLogger("UserModService");

export enum UserModServiceError {
	NotFound = "NotFound",
}

export class UserModService {
	constructor(protected readonly user: UserData) {}

	async findAllUserMods(): Promise<
		{ data: ModSummaryData[]; meta: UserModsMetaData } | UserModServiceError
	> {
		logger.debug({ userId: this.user.id }, "findAllUserMods start");

		const countPublished = await ModSummary.countDocuments({
			maintainers: this.user.id,
			visibility: ModVisibility.Public,
		});

		logger.debug({ countPublished }, "Counted published mods");

		const docs = await ModSummary.find({ maintainers: this.user.id })
			.sort({ createdAt: "desc" })
			.lean()
			.exec();

		logger.debug(
			{ docs: docs.length, countPublished },
			"Fetched all user mods",
		);

		const meta: UserModsMetaData = {
			published: countPublished,
			totalDownloads: 0, // TODO: Placeholder for future implementation
			averageRating: 0, // TODO: Placeholder for future implementation
		};

		return {
			data: ModSummaryData.array().parse(docs),
			meta: UserModsMetaData.parse(meta),
		};
	}

	async findUserModById(modId: string): Promise<ModData | UserModServiceError> {
		logger.debug({ userId: this.user.id, modId }, "findUserModById start");
		const mod = await Mod.findOne({ id: modId, maintainers: this.user.id })
			.lean()
			.exec();

		if (!mod) {
			logger.debug(
				{ modId },
				"User attempted to fetch mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		logger.debug({ modId }, "User successfully fetched mod");

		return ModData.parse(mod);
	}

	async createMod(
		createData: ModCreateData,
	): Promise<ModData | UserModServiceError> {
		logger.debug({ userId: this.user.id, createData }, "createMod start");
		const id = crypto.randomUUID();

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
			visibility: ModVisibility.Private,
			maintainers: [this.user.id],
		};

		const result = await Mod.create(ModData.parse(modData));
		logger.debug({ modId: id }, "User successfully created mod");

		return ModData.parse(result);
	}

	async updateMod(modData: ModData): Promise<undefined | UserModServiceError> {
		logger.debug(
			{ userId: this.user.id, modId: modData.id },
			"updateMod start",
		);

		const mod = await Mod.findOneAndUpdate(
			{ id: modData.id, maintainers: this.user.id },
			modData,
		).exec();

		if (!mod) {
			logger.warn(
				{ modId: modData.id },
				"User attempted to update mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		logger.debug({ modId: modData.id }, "User successfully updated mod");
	}

	async deleteMod(id: string): Promise<undefined | UserModServiceError> {
		logger.debug({ userId: this.user.id, modId: id }, "deleteMod start");

		const result = await Mod.findOneAndDelete({
			id,
			maintainers: this.user.id,
		}).exec();

		if (!result) {
			logger.warn(
				{ modId: id },
				"User attempted to delete mod but it was not found",
			);
			return UserModServiceError.NotFound;
		}

		logger.debug({ modId: id }, "User successfully deleted mod");
	}
}
