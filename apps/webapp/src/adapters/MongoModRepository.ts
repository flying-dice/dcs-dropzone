import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { QueryFilter } from "mongoose";
import type { ModCategory } from "../application/enums/ModCategory.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { ModFilters, ModRepository } from "../application/ports/ModRepository.ts";
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

const logger = getLogger("MongoModRepository");

/**
 * MongoDB implementation of the ModRepository port using Mongoose.
 */
export class MongoModRepository implements ModRepository {
	@Log(logger)
	async createMod(modData: ModData): Promise<ModData> {
		const doc = await Mod.create(modData);
		return ModDataSchema.parse(doc.toObject());
	}

	@Log(logger)
	async updateMod(updateData: ModUpdateData): Promise<ModData | undefined> {
		const doc = await Mod.findOneAndUpdate({ id: updateData.id }, updateData, { new: true }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModDataSchema.parse(doc);
	}

	@Log(logger)
	async deleteMod(modId: string): Promise<ModData | undefined> {
		const doc = await Mod.findOneAndDelete({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		// Also delete related releases
		await ModRelease.deleteMany({ modId }).exec();
		return ModDataSchema.parse(doc);
	}

	@Log(logger)
	async findModById(modId: string): Promise<ModData | undefined> {
		const doc = await Mod.findOne({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModDataSchema.parse(doc);
	}

	@Log(logger)
	async setModDownloadsCount(modId: string, downloadsCount: number): Promise<void> {
		await Mod.updateOne({ id: modId }, { downloadsCount }).exec();
	}

	@Log(logger)
	async createModRelease(releaseData: ModReleaseData): Promise<ModReleaseData> {
		const doc = await ModRelease.create(releaseData);
		// Update mod's latestReleaseId to the new release
		await Mod.updateOne({ id: releaseData.modId }, { latestReleaseId: releaseData.id });
		return ModReleaseDataSchema.parse(doc.toObject());
	}

	@Log(logger)
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

	@Log(logger)
	async deleteModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const doc = await ModRelease.findOneAndDelete({ id: releaseId, modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModReleaseDataSchema.parse(doc);
	}

	@Log(logger)
	async findModReleaseById(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const doc = await ModRelease.findOne({ id: releaseId, modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return ModReleaseDataSchema.parse(doc);
	}

	@Log(logger)
	async findModReleasesByModId(modId: string): Promise<ModReleaseData[]> {
		const docs = await ModRelease.find({ modId }).sort({ createdAt: -1 }).lean().exec();
		return ModReleaseDataSchema.array().parse(docs);
	}

	@Log(logger)
	async setModReleaseDownloadsCount(releaseId: string, downloadsCount: number): Promise<void> {
		await ModRelease.updateOne({ id: releaseId }, { downloadsCount }).exec();
	}

	@Log(logger)
	async isMaintainerForMod(userId: string, modId: string): Promise<boolean | undefined> {
		const doc = await Mod.findOne({ id: modId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return doc.maintainers.includes(userId);
	}

	@Log(logger)
	async findAllModsForMaintainerSortedByCreatedAtDesc(userId: string): Promise<ModSummaryData[]> {
		const docs = await ModSummary.find({ maintainers: userId }).sort({ createdAt: -1 }).lean().exec();
		return ModSummaryDataSchema.array().parse(docs);
	}

	@Log(logger)
	async getTotalDownloadsCountForMaintainer(userId: string): Promise<number> {
		const result = await Mod.aggregate([
			{ $match: { maintainers: userId } },
			{ $group: { _id: null, total: { $sum: "$downloadsCount" } } },
		]).exec();
		return result[0]?.total || 0;
	}

	@Log(logger)
	async getTotalPublicModsCountForMaintainer(userId: string): Promise<number> {
		return Mod.countDocuments({ maintainers: userId, visibility: ModVisibility.PUBLIC }).exec();
	}

	@Log(logger) async findPublicModById(modId: string): Promise<ModData | undefined> {
		const doc = await Mod.findOne({ id: modId, visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] } })
			.lean()
			.exec();

		if (!doc) {
			return undefined;
		}

		return ModDataSchema.parse(doc);
	}

	@Log(logger)
	async findAllPublishedMods(query: { page: number; size: number; filter?: ModFilters }): Promise<{
		data: ModSummaryData[];
		count: number;
		categories: ModCategory[];
		tags: string[];
		maintainers: string[];
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
		const maintainers = await ModSummary.distinct("maintainers", filterQ).exec();

		return {
			data: ModSummaryDataSchema.array().parse(docs),
			count,
			categories,
			tags,
			maintainers,
		};
	}

	@Log(logger)
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

	@Log(logger)
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

	@Log(logger)
	async findAllTags(): Promise<string[]> {
		const tags = await Mod.distinct("tags", {
			visibility: ModVisibility.PUBLIC,
		}).exec();
		return tags.sort();
	}

	@Log(logger)
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

	@Log(logger)
	async getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }> {
		const result = await Mod.aggregate([
			{ $match: { visibility: ModVisibility.PUBLIC } },
			{
				$group: {
					_id: null,
					totalMods: { $sum: 1 },
					totalDownloads: { $sum: "$downloadsCount" },
				},
			},
		]).exec();

		return {
			totalMods: result[0]?.totalMods || 0,
			totalDownloads: result[0]?.totalDownloads || 0,
		};
	}

	@Log(logger)
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

	@Log(logger)
	async findPublicModReleases(modId: string): Promise<ModReleaseData[] | undefined> {
		const mod = await Mod.findOne({
			id: modId,
			visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
		})
			.lean()
			.exec();
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

	@Log(logger)
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

	@Log(logger)
	async findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]> {
		if (modIds.length === 0) {
			return [];
		}

		const aggregated = await ModRelease.aggregate([
			{
				$match: {
					modId: { $in: modIds },
					visibility: ModVisibility.PUBLIC,
				},
			},
			{
				$sort: { createdAt: -1 },
			},
			{
				$group: {
					_id: "$modId",
					id: { $first: "$id" },
					version: { $first: "$version" },
					createdAt: { $first: "$createdAt" },
				},
			},
		]).exec();

		return aggregated.map((doc: any) => ({
			modId: doc._id as string,
			id: doc.id as string,
			version: doc.version as string,
			createdAt: (doc.createdAt as Date).toString(),
		}));
	}
}
