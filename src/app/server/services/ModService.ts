import { basename, extname } from "node:path";
import { camelToKebabCase } from "@mantine/core";
import { toCamelCase } from "drizzle-orm/casing";
import { getLogger } from "log4js";
import type { RootFilterQuery } from "mongoose";
import {
	MissionScriptRunOn,
	ModCategories,
	ModCategory,
	ModVisibility,
	SymbolicLinkDestRoot,
} from "../../../common/data.ts";
import {
	getRegistryEntry,
	getRegistryIndex,
} from "../../client/_autogen/legacy_api.ts";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModData } from "../schemas/ModData.ts";
import {
	ModReleaseData,
	type ModReleaseMissionScriptData,
	type ModReleaseSymbolicLinkData,
} from "../schemas/ModReleaseData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";

const logger = getLogger("ModService");

export class ModService {
	async findById(id: string): Promise<ModSummaryData | null> {
		logger.debug({ id }, "Finding mod by id");

		const doc = await ModSummary.findOne({ id }).lean().exec();

		if (!doc) {
			return null;
		}

		return ModSummaryData.parse(doc);
	}

	async findAllByIds(ids: string[]): Promise<ModSummaryData[]> {
		const filterQ: RootFilterQuery<typeof ModSummary> = {
			id: { $in: ids },
		};

		logger.debug("Finding all mods by ids");

		const docs = await ModSummary.find(filterQ).lean().exec();

		return ModSummaryData.array().parse(docs);
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

		return ModSummaryData.array().parse(docs);
	}

	async findAllPublishedMods(
		page: number,
		size: number,
		filter: {
			category?: ModCategory;
			maintainers?: string[];
			tags?: string[];
			term?: string;
		} = {},
	): Promise<{
		data: ModSummaryData[];
		page: PageData;
		filter: ModAvailableFilterData;
	}> {
		const filterQ: RootFilterQuery<typeof ModSummary> = {
			visibility: ModVisibility.PUBLIC,
		};

		if (filter.category) {
			logger.debug(
				{ filterCategory: filter.category },
				"Applying category filter",
			);
			filterQ.category = filter.category;
		}

		if (filter.maintainers && filter.maintainers.length > 0) {
			logger.debug(
				{ filterMaintainers: filter.maintainers },
				"Applying maintainers filter",
			);
			filterQ.maintainers = { $in: filter.maintainers };
		}

		if (filter.tags && filter.tags.length > 0) {
			logger.debug({ filterTags: filter.tags }, "Applying tags filter");
			filterQ.tags = { $all: filter.tags };
		}

		if (filter.term) {
			logger.debug({ filterTerm: filter.term }, "Applying term filter");
			filterQ.name = { $regex: filter.term, $options: "i" };
		}

		logger.debug("Finding all published mods");
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
			data: ModSummaryData.array().parse(docs),
			page: PageData.parse({
				number: page,
				size: size,
				totalPages: Math.ceil(count / size) || 1,
				totalElements: count,
			}),
			filter: ModAvailableFilterData.parse({
				categories,
				maintainers,
				tags,
			}),
		};
	}

	async migrateLegacyRegistry() {
		logger.debug("Performing database migration");
		const legacyIndex = await getRegistryIndex();

		for (const { id } of legacyIndex.data) {
			const registryEntry = await getRegistryEntry(id);

			logger.debug(
				{ id: registryEntry.data.id, name: registryEntry.data.name },
				`Migrating Registry Entry ${id}`,
			);

			const existingMod = await Mod.findOne({
				name: registryEntry.data.name,
			}).lean();

			const modDocumentId = existingMod ? existingMod.id : crypto.randomUUID();

			const mod: ModData = ModData.parse({
				id: modDocumentId,
				name: registryEntry.data.name,
				description: registryEntry.data.description,
				content: Buffer.from(registryEntry.data.content, "base64").toString(
					"utf-8",
				),
				visibility: ModVisibility.PUBLIC,
				screenshots: [],
				thumbnail: registryEntry.data.imageUrl,
				tags: registryEntry.data.tags.map((it) =>
					camelToKebabCase(toCamelCase(it)),
				),
				category: ModCategories.includes(registryEntry.data.category as any)
					? registryEntry.data.category
					: ModCategory.OTHER,
				dependencies: registryEntry.data.dependencies || [],
				maintainers: ["16135506"],
				downloadsCount: 20,
				ratingsCount: 5,
				averageRating: 3.2,
			});

			await Mod.findOneAndUpdate({ name: mod.name }, mod, {
				upsert: true,
			}).exec();

			const modDocument = await Mod.findOne({ name: mod.name }).exec();
			if (!modDocument) {
				throw new Error("Failed to retrieve or create mod document");
			}

			logger.debug(
				{
					documentId: modDocument._id,
					name: modDocument.name,
					id: modDocument.id,
				},
				`Migrated Registry Entry for ${mod.name}`,
			);

			for (const version of registryEntry.data.versions) {
				const existingRelease = await ModRelease.findOne({
					mod_id: modDocument.id,
					version: version.version,
				}).lean();

				const releaseId = existingRelease
					? existingRelease.id
					: crypto.randomUUID();

				const release: ModReleaseData = ModReleaseData.parse({
					id: releaseId,
					version: version.version,
					mod_id: modDocument.id,
					changelog: version.name,
					visibility: ModVisibility.PUBLIC,
					assets: version.assets.map((assets) => ({
						name: decodeURIComponent(
							basename(assets.remoteSource).replace(
								extname(assets.remoteSource),
								"",
							),
						),
						urls: [assets.remoteSource],
						isArchive:
							assets.remoteSource.match(
								/\.(zip|rar|7z|tar\.gz|tar\.bz2|tar\.xz)$/i,
							) !== null,
					})),
					symbolicLinks: version.assets.flatMap((assets) =>
						assets.links.map((link): ModReleaseSymbolicLinkData => {
							const legacyTarget = this.convertLegacyPath(link.target);

							return {
								name: basename(link.source),
								src: link.source,
								dest: legacyTarget.path,
								destRoot: legacyTarget.root,
							};
						}),
					),
					missionScripts: version.assets.flatMap((assets) =>
						assets.links
							.filter((it) => it.runonstart)
							.map(
								(link): ModReleaseMissionScriptData => ({
									...this.convertLegacyPath(link.target),
									name: basename(link.source),
									purpose: "Unknown",
									runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
								}),
							),
					),
				});

				await ModRelease.findOneAndUpdate(
					{ mod_id: modDocument.id, version: release.version },
					release,
					{ upsert: true },
				);

				const releaseDocument = await ModRelease.findOne({
					mod_id: modDocument.id,
					version: release.version,
				}).exec();
				if (!releaseDocument) {
					throw new Error("Failed to retrieve or create mod release document");
				}

				logger.debug(
					{
						documentId: releaseDocument._id,
						releaseId: releaseDocument.id,
						modId: modDocument.id,
						version: releaseDocument.version,
					},
					`Migrated Mod Release ${release.version} for Mod ${mod.name}`,
				);
			}
		}
	}

	private convertLegacyPath(path: string): {
		path: string;
		root: SymbolicLinkDestRoot;
	} {
		if (path.startsWith("{{DCS_USER_DIR}}/")) {
			return {
				path: path.replace("{{DCS_USER_DIR}}/", ""),
				root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			};
		}
		throw new Error("Unsupported path root");
	}

	async getCategoryCounts() {
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

		const counts: Record<ModCategory, number> = Object.values(
			ModCategory,
		).reduce(
			(acc, category) => {
				acc[category] = 0;
				return acc;
			},
			{} as Record<ModCategory, number>,
		);

		for (const entry of result) {
			counts[entry._id as ModCategory] = entry.count;
		}

		return counts;
	}

	async getAllTags(): Promise<string[]> {
		const tags = await Mod.distinct("tags", {
			visibility: ModVisibility.PUBLIC,
		}).exec();

		return tags.sort();
	}
}
