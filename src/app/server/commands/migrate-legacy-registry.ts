import { basename, extname } from "node:path";
import { camelToKebabCase } from "@mantine/core";
import { toCamelCase } from "drizzle-orm/casing";
import { getLogger } from "log4js";
import { z } from "zod";
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
import { ModData } from "../schemas/ModData.ts";
import {
	ModReleaseData,
	type ModReleaseMissionScriptData,
	type ModReleaseSymbolicLinkData,
} from "../schemas/ModReleaseData.ts";

const logger = getLogger("commands/migrate-legacy-registry");

const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	generateId: () => string;
}

function convertLegacyPath(path: string): {
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

export default async function (input: Input, deps: Deps): Promise<void> {
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

		const modDocumentId = existingMod ? existingMod.id : deps.generateId();

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
				: deps.generateId();

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
						const legacyTarget = convertLegacyPath(link.target);

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
								...convertLegacyPath(link.target),
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
