import { basename, extname } from "node:path";
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
import Logger from "../Logger.ts";
import { ModData } from "../schemas/ModData.ts";
import {
	ModReleaseData,
	type ModReleaseMissionScriptData,
	type ModReleaseSymbolicLinkData,
} from "../schemas/ModReleaseData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";

const logger = Logger.getLogger("ModService");

export class ModService {
	async findAllPublishedMods(
		page: number,
		size: number,
	): Promise<{ data: ModSummaryData[]; page: PageData }> {
		const count = await ModSummary.countDocuments();

		const docs = await ModSummary.find({
			visibility: ModVisibility.Public,
		})
			.skip((page - 1) * size)
			.sort({ createdAt: -1 })
			.limit(size)
			.lean()
			.exec();

		return {
			data: ModSummaryData.array().parse(docs),
			page: PageData.parse({
				number: page,
				size: size,
				totalPages: Math.ceil(count / size) || 1,
				totalElements: count,
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

			const mod: ModData = ModData.parse({
				id: crypto.randomUUID(),
				name: registryEntry.data.name,
				description: registryEntry.data.description,
				content: Buffer.from(registryEntry.data.content, "base64").toString(
					"utf-8",
				),
				visibility: ModVisibility.Public,
				screenshots: [],
				thumbnail: registryEntry.data.imageUrl,
				tags: registryEntry.data.tags,
				category: ModCategories.includes(registryEntry.data.category as any)
					? registryEntry.data.category
					: ModCategory.Other,
				dependencies: registryEntry.data.dependencies || [],
				maintainers: ["16135506"],
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
				const release: ModReleaseData = ModReleaseData.parse({
					id: crypto.randomUUID(),
					version: version.version,
					mod_id: modDocument.id,
					changelog: version.name,
					visibility: ModVisibility.Public,
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
}
