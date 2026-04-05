import * as assert from "node:assert";
import {
	authProviderLogin,
	configureFetchClient,
	createUserMod,
	createUserModRelease,
	getUserModReleases,
	getUserMods,
	ModDataCategory,
	type UpdateUserModBody,
	UpdateUserModBodyVisibility,
	type UpdateUserModReleaseBody,
	updateUserMod,
	updateUserModRelease,
} from "@packages/clients/webapp";
import fetchCookie from "fetch-cookie";
import { StatusCodes } from "http-status-codes";

async function getOrCreateUserMod(userMod: UpdateUserModBody): Promise<string> {
	const mods = await getUserMods();
	assert.ok(mods.status === StatusCodes.OK);

	const existingMod = mods.data.data.find((mod) => mod.name === userMod.name);

	if (existingMod) {
		return existingMod.id;
	}

	const createUserModResult = await createUserMod({
		name: userMod.name,
		category: userMod.category,
		description: userMod.description,
	});

	assert.ok(createUserModResult.status === StatusCodes.CREATED);

	return createUserModResult.data.id;
}

async function getOrCreateUserModRelease(modId: string, userModRelease: UpdateUserModReleaseBody): Promise<string> {
	const releases = await getUserModReleases(modId);
	assert.ok(releases.status === StatusCodes.OK);

	const existingRelease = releases.data.data.find((release) => release.version === userModRelease.version);

	if (existingRelease) {
		return existingRelease.id;
	}

	const createUserModReleaseResult = await createUserModRelease(modId, {
		version: userModRelease.version,
	});
	assert.ok(createUserModReleaseResult.status === StatusCodes.CREATED);

	return createUserModReleaseResult.data.id;
}

configureFetchClient({ baseUrl: "http://localhost:3000/" }, fetchCookie(fetch) as any);

await authProviderLogin();

const userMod: UpdateUserModBody = {
	name: "Hello World Mod",
	category: ModDataCategory.OTHER,
	content:
		"# Example Hello World Mod\n\nDCS world Hello World Mod\n\nOn DCS Startup logs hello world to the console\n\n> This content is presented to the user when they open the mod page\n",
	dependencies: [],
	description: "A simple mod that logs hello world to the console on DCS startup",
	maintainers: ["0"],
	screenshots: [],
	tags: ["hello"],
	thumbnail:
		"https://raw.githubusercontent.com/flying-dice/dcs-dropzone-registry/refs/heads/main/registry/example-mod/index.png",
	visibility: UpdateUserModBodyVisibility.PUBLIC,
};

const userModRelease: UpdateUserModReleaseBody = {
	version: "0.1.0",
	assets: [
		{
			id: "4690919a-a3f1-4a9c-b239-1f89847e2fc4",
			name: "hello-world",
			urls: [
				{
					id: "1d3d6f65-65d9-4b0c-b881-2572a8fd7a3f",
					url: "https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua",
				},
			],
			isArchive: false,
		},
	],
	changelog: "RC1",
	downloadsCount: 0,
	missionScripts: [],
	symbolicLinks: [
		{
			id: "1e79ae3f-199a-4d8b-907b-34294ed822ab",
			name: "hello-world.lua",
			src: "hello-world.lua",
			dest: "Scripts/Hooks/hello-world.lua",
			destRoot: "DCS_WORKING_DIR",
		},
	],
	visibility: UpdateUserModBodyVisibility.PUBLIC,
};

const userModId = await getOrCreateUserMod(userMod);

await updateUserMod(userModId, {
	category: userMod.category,
	content: userMod.content,
	dependencies: userMod.dependencies,
	description: userMod.description,
	maintainers: userMod.maintainers,
	name: userMod.name,
	screenshots: userMod.screenshots,
	tags: userMod.tags,
	thumbnail: userMod.thumbnail,
	visibility: userMod.visibility,
});

const userModReleaseId = await getOrCreateUserModRelease(userModId, userModRelease);

await updateUserModRelease(userModId, userModReleaseId, {
	assets: userModRelease.assets,
	changelog: userModRelease.changelog,
	missionScripts: userModRelease.missionScripts,
	symbolicLinks: userModRelease.symbolicLinks,
	version: userModRelease.version,
	visibility: userModRelease.visibility,
});
