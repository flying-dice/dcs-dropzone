import {
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../../common/data.ts";
import type { ModReleaseData } from "../_autogen/api.ts";

/**
 * Generates a human-readable explanation plan for a mod release installation.
 * The plan describes all actions that will be performed during installation.
 */
export function generateExplainPlan(release: ModReleaseData): string {
	const sections: string[] = [];

	// Header section with release info
	sections.push(
		`# Installation Plan for Release ${release.version}\n\n` +
			`This plan describes all actions that will be performed when installing this mod release.\n`,
	);

	// Changelog summary
	if (release.changelog?.trim()) {
		const changelogPreview =
			release.changelog.length > 200
				? `${release.changelog.substring(0, 200)}...`
				: release.changelog;
		sections.push(`## Release Notes\n\n${changelogPreview}\n`);
	}

	// Assets section
	if (release.assets && release.assets.length > 0) {
		sections.push(`## Assets\n`);

		for (const asset of release.assets) {
			const urlCount = asset.urls.length;
			const downloadSource =
				urlCount === 1
					? "from the provided URL"
					: `from one of ${urlCount} available mirror URLs`;

			if (asset.isArchive) {
				sections.push(
					`- **${asset.name}** will be downloaded ${downloadSource}. ` +
						`This is an archive file that will be automatically extracted after download.\n`,
				);
			} else {
				sections.push(
					`- **${asset.name}** will be downloaded ${downloadSource}.\n`,
				);
			}
		}
		sections.push("");
	}

	// Symlinks section
	if (release.symbolicLinks && release.symbolicLinks.length > 0) {
		sections.push(`## Symbolic Links\n`);

		for (const symlink of release.symbolicLinks) {
			const rootType =
				symlink.destRoot === SymbolicLinkDestRoot.DCS_WORKING_DIR
					? "DCS working directory (Saved Games)"
					: "DCS installation directory";

			sections.push(
				`- A symbolic link will be created from **${symlink.src}** to **${symlink.dest}** ` +
					`within the ${rootType}.\n`,
			);
		}
		sections.push("");
	}

	// Mission Scripts section
	if (release.missionScripts && release.missionScripts.length > 0) {
		sections.push(`## Mission Scripts\n`);

		for (const script of release.missionScripts) {
			const timing =
				script.runOn === MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE
					? "Mission Start (Before Sanitize)"
					: "Mission Start (After Sanitize)";

			const rootType =
				script.root === SymbolicLinkDestRoot.DCS_WORKING_DIR
					? "DCS working directory (Saved Games)"
					: "DCS installation directory";

			sections.push(
				`- The script at **${script.path}** (in the ${rootType}) will be installed ` +
					`and will run at ${timing}.\n`,
			);
		}
		sections.push("");
	}

	// Summary section
	sections.push(`## Summary\n`);

	const assetCount = release.assets?.length || 0;
	const archiveCount = release.assets?.filter((a) => a.isArchive).length || 0;
	const symlinkCount = release.symbolicLinks?.length || 0;
	const scriptCount = release.missionScripts?.length || 0;

	if (assetCount === 0 && symlinkCount === 0 && scriptCount === 0) {
		sections.push(
			`This release contains no actionable items. ` +
				`No files will be downloaded, no symbolic links will be created, and no mission scripts will be installed.\n`,
		);
	} else {
		const summaryParts: string[] = [];

		if (assetCount > 0) {
			summaryParts.push(
				`${assetCount} asset${assetCount !== 1 ? "s" : ""} will be downloaded`,
			);
			if (archiveCount > 0) {
				summaryParts.push(
					`${archiveCount} archive${archiveCount !== 1 ? "s" : ""} will be extracted`,
				);
			}
		}

		if (symlinkCount > 0) {
			summaryParts.push(
				`${symlinkCount} symbolic link${symlinkCount !== 1 ? "s" : ""} will be created`,
			);
		}

		if (scriptCount > 0) {
			summaryParts.push(
				`${scriptCount} mission script${scriptCount !== 1 ? "s" : ""} will be installed`,
			);
		}

		const summaryText = summaryParts.join(", ").replace(/,([^,]*)$/, ", and$1");
		sections.push(`In total, ${summaryText}.\n`);
	}

	return sections.join("\n");
}
