import type { QueryFilter } from "mongoose";
import type { ModCategory } from "../application/enums/ModCategory.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { ModRepository } from "../application/ports/ModRepository.ts";
import type { ModData } from "../application/schemas/ModData.ts";
import { ModData as ModDataSchema } from "../application/schemas/ModData.ts";
import type { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import { ModReleaseData as ModReleaseDataSchema } from "../application/schemas/ModReleaseData.ts";
import type { ModReleaseUpdateData } from "../application/schemas/ModReleaseUpdateData.ts";
import type { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import { ModSummaryData as ModSummaryDataSchema } from "../application/schemas/ModSummaryData.ts";
import type { ModUpdateData } from "../application/schemas/ModUpdateData.ts";
import { Mod } from "../database/entities/Mod.ts";
import { ModRelease } from "../database/entities/ModRelease.ts";
import { ModSummary } from "../database/entities/ModSummary.ts";
import { User } from "../database/entities/User.ts";

/**
 * MongoDB implementation of the ModRepository port using Mongoose.
 */
export class MongoModRepository implements ModRepository {
	async createMod(modData: ModData): Promise<ModData> {
		const doc = await Mod.create(modData);
		return ModDataSchema.parse(doc.toObject());
	}

	async updateMod(updateData: ModUpdateData): Promise<ModData | undefined> {
		const doc = await Mod.findOneAndUpdate({ id: updateData.id }, updateData, { new: true }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModDataSchema.parse(doc);
	}

	async deleteMod(modId: string): Promise<ModData | undefined> {
		const doc = await Mod.findOneAndDelete({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		// Also delete related releases
		await ModRelease.deleteMany({ modId }).exec();
		return ModDataSchema.parse(doc);
	}

	async findModById(modId: string): Promise<ModData | undefined> {
		const doc = await Mod.findOne({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModDataSchema.parse(doc);
	}

	async setModDownloadsCount(modId: string, downloadsCount: number): Promise<void> {
		await Mod.updateOne({ id: modId }, { downloadsCount }).exec();
	}

	async createModRelease(releaseData: ModReleaseData): Promise<ModReleaseData> {
		const doc = await ModRelease.create(releaseData);
		return ModReleaseDataSchema.parse(doc.toObject());
	}

	async updateModRelease(updateData: ModReleaseUpdateData): Promise<ModReleaseData | undefined> {
		const doc = await ModRelease.findOneAndUpdate({ id: updateData.id, modId: updateData.modId }, updateData, {
			new: true,
		})
			.lean()
			.exec();
		if (!doc) {
			return undefined;
		}
		return ModReleaseDataSchema.parse(doc);
	}

	async deleteModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const doc = await ModRelease.findOneAndDelete({ id: releaseId, modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModReleaseDataSchema.parse(doc);
	}

	async findModReleaseById(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const doc = await ModRelease.findOne({ id: releaseId, modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModReleaseDataSchema.parse(doc);
	}

	async findModReleasesByModId(modId: string): Promise<ModReleaseData[]> {
		const docs = await ModRelease.find({ modId }).sort({ createdAt: -1 }).lean().exec();
		return ModReleaseDataSchema.array().parse(docs);
	}

	async setModReleaseDownloadsCount(releaseId: string, downloadsCount: number): Promise<void> {
		await ModRelease.updateOne({ id: releaseId }, { downloadsCount }).exec();
	}

	async isMaintainerForMod(userId: string, modId: string): Promise<boolean | undefined> {
		const doc = await Mod.findOne({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return doc.maintainers.includes(userId);
	}

	async findAllModsForMaintainerSortedByCreatedAtDesc(userId: string): Promise<ModSummaryData[]> {
		const docs = await ModSummary.find({ maintainers: userId }).sort({ createdAt: -1 }).lean().exec();
		return ModSummaryDataSchema.array().parse(docs);
	}

	async getTotalDownloadsCountForMaintainer(userId: string): Promise<number> {
		const result = await Mod.aggregate([
			{ $match: { maintainers: userId } },
			{ $group: { _id: null, total: { $sum: "$downloadsCount" } } },
		]).exec();
		return result[0]?.total || 0;
	}

	async getTotalPublicModsCountForMaintainer(userId: string): Promise<number> {
		return Mod.countDocuments({ maintainers: userId, visibility: ModVisibility.PUBLIC }).exec();
	}

	// Additional methods for public queries
	async findPublicModById(
		modId: string,
	): Promise<{ mod: ModData; maintainers: { id: string; username: string }[] } | undefined> {
		const doc = await Mod.findOne({ id: modId, visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] } })
			.lean()
			.exec();

		if (!doc) {
			return undefined;
		}

		const maintainers = await User.find({ id: { $in: doc.maintainers } })
			.lean()
			.exec();

		return {
			mod: ModDataSchema.parse(doc),
			maintainers: maintainers.map((m) => ({ id: m.id, username: m.username })),
		};
	}

	async findAllPublishedMods(query: {
		page: number;
		size: number;
		filter?: {
			category?: ModCategory;
			maintainers?: string[];
			tags?: string[];
			term?: string;
		};
	}): Promise<{
		data: ModSummaryData[];
		count: number;
		categories: string[];
		tags: string[];
		maintainers: { id: string; username: string }[];
	}> {
		const { page, size, filter = {} } = query;

		const filterQ: QueryFilter<typeof ModSummary> = {
			visibility: ModVisibility.PUBLIC,
		};

		if (filter.category) {
			filterQ.category = filter.category;
		}

		if (filter.maintainers && filter.maintainers.length > 0) {
			filterQ.maintainers = { $in: filter.maintainers };
		}

		if (filter.tags && filter.tags.length > 0) {
			filterQ.tags = { $all: filter.tags };
		}

		if (filter.term) {
			filterQ.name = { $regex: filter.term, $options: "i" };
		}

		const count = await ModSummary.countDocuments(filterQ);

		const docs = await ModSummary.find(filterQ)
			.skip((page - 1) * size)
			.sort({ createdAt: -1 })
			.limit(size)
			.lean()
			.exec();

		const categories = await ModSummary.distinct("category", filterQ).exec();
		const tags = await ModSummary.distinct("tags", filterQ).exec();
		const maintainers = await ModSummary.aggregate([
			{ $match: filterQ },
			{ $unwind: "$maintainers" },
			{
				$group: {
					_id: "$maintainers",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "id",
					as: "userDetails",
				},
			},
			{ $unwind: "$userDetails" },
			{
				$project: {
					id: "$userDetails.id",
					username: "$userDetails.username",
				},
			},
		]).exec();

		return {
			data: ModSummaryDataSchema.array().parse(docs),
			count,
			categories,
			tags,
			maintainers,
		};
	}

	async findAllFeaturedMods(): Promise<ModSummaryData[]> {
		const docs = await ModSummary.find({
			visibility: ModVisibility.PUBLIC,
			featuredAt: { $ne: null },
		})
			.sort({ featuredAt: -1 })
			.limit(4)
			.lean()
			.exec();

		return ModSummaryDataSchema.array().parse(docs);
	}

	async findAllPopularMods(): Promise<ModSummaryData[]> {
		const docs = await ModSummary.find({
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ downloadsCount: "desc" })
			.limit(10)
			.lean()
			.exec();

		return ModSummaryDataSchema.array().parse(docs);
	}

	async findAllTags(): Promise<string[]> {
		const tags = await Mod.distinct("tags", {
			visibility: ModVisibility.PUBLIC,
		}).exec();
		return tags.sort();
	}

	async getCategoryCounts(): Promise<Record<string, number>> {
		const result = await Mod.aggregate([
			{
				$match: {
					visibility: ModVisibility.PUBLIC,
				},
			},
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 },
				},
			},
		]).exec();

		const counts: Record<string, number> = {};
		for (const entry of result) {
			counts[entry._id as string] = entry.count;
		}
		return counts;
	}

	async getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }> {
		const totalMods = await Mod.countDocuments({
			visibility: ModVisibility.PUBLIC,
		}).exec();

		const result = await Mod.aggregate([
			{ $match: { visibility: ModVisibility.PUBLIC } },
			{
				$group: {
					_id: null,
					total: { $sum: "$downloadsCount" },
				},
			},
		]);

		return {
			totalMods,
			totalDownloads: result[0]?.total || 0,
		};
	}

	async findPublicModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const modExists = await Mod.exists({
			id: modId,
			visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
		}).exec();
		if (!modExists) {
			return undefined;
		}

		const release = await ModRelease.findOne({
			id: releaseId,
			modId,
			visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
		})
			.lean()
			.exec();

		if (!release) {
			return undefined;
		}

		return ModReleaseDataSchema.parse(release);
	}

	async findPublicModReleases(modId: string): Promise<ModReleaseData[] | undefined> {
		const mod = await Mod.findOne({ id: modId }).lean().exec();
		if (!mod) {
			return undefined;
		}

		const releases = await ModRelease.find({
			modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		return ModReleaseDataSchema.array().parse(releases);
	}

	async findLatestPublicModRelease(modId: string): Promise<ModReleaseData | undefined> {
		const mod = await Mod.findOne({
			id: modId,
			visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
		}).exec();

		if (!mod || !mod.latestReleaseId) {
			return undefined;
		}

		const release = await ModRelease.findOne({
			id: mod.latestReleaseId,
			modId,
			visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
		})
			.lean()
			.exec();

		if (!release) {
			return undefined;
		}

		return ModReleaseDataSchema.parse(release);
	}

	async findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]> {
		const results: { modId: string; id: string; version: string; createdAt: string }[] = [];

		for (const modId of modIds) {
			const latestRelease = await ModRelease.findOne({
				modId: modId,
				visibility: ModVisibility.PUBLIC,
			})
				.sort({ createdAt: -1 })
				.lean()
				.exec();

			if (latestRelease) {
				results.push({
					modId: modId,
					id: latestRelease.id,
					version: latestRelease.version,
					createdAt: latestRelease.createdAt.toString(),
				});
			}
		}

		return results;
	}
}
