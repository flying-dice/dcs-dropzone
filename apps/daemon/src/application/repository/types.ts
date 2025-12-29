import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";

/**
 * Basic release information without assets, links, or scripts
 */
export type ReleaseInfo = {
	releaseId: string;
	modId: string;
	modName: string;
	version: string;
	versionHash: string;
	dependencies: string[];
};

/**
 * Mission script information returned by runOn query
 */
export type MissionScriptByRunOn = {
	modName: string;
	modVersion: string;
	path: string;
	pathRoot: SymbolicLinkDestRoot;
};

/**
 * Release asset information
 */
export type ReleaseAsset = {
	id: string;
	releaseId: string;
	name: string;
	isArchive: boolean;
	urls: string[];
};

/**
 * Symbolic link information
 */
export type SymbolicLink = {
	id: string;
	releaseId: string;
	name: string;
	src: string;
	dest: string;
	destRoot: SymbolicLinkDestRoot;
	installedPath: string | null;
};

/**
 * Mission script information
 */
export type MissionScript = {
	id: string;
	releaseId: string;
	name: string;
	purpose: string;
	path: string;
	root: SymbolicLinkDestRoot;
	runOn: MissionScriptRunOn;
	installedPath: string | null;
};
