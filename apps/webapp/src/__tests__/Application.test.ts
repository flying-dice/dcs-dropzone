import "./log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { Application } from "../application/Application.ts";
import { ModCategory } from "../application/enums/ModCategory.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { UserData } from "../application/schemas/UserData.ts";
import { TestCases } from "./TestCases.ts";

const TEST_USER: Readonly<UserData> = {
	id: "test-user-id",
	username: "TEST_USER",
	name: "Test User",
	avatarUrl: "https://example.com/avatar.png",
	profileUrl: "https://example.com/profile",
};

describe.each(TestCases)("$label", ({ build }) => {
	let app: Application;
	let cleanup: () => Promise<void>;

	beforeEach(async () => {
		const c = await build();
		app = c.app;
		cleanup = c.cleanup;
		await app.users.saveUserDetails(TEST_USER);
	});

	afterEach(async () => {
		await cleanup();
	});

	describe("Users Service", () => {
		it("should get user by id", async () => {
			const result = await app.users.getUserById(TEST_USER.id);

			expect(result.isOk()).toBe(true);
			result.match(
				(user) => {
					expect(user.id).toBe(TEST_USER.id);
					expect(user.username).toBe(TEST_USER.username);
				},
				() => {},
			);
		});

		it("should return UserNotFound for non-existent user", async () => {
			const result = await app.users.getUserById("non-existent-id");

			expect(result.isErr()).toBe(true);
			result.match(
				() => {},
				(error) => {
					expect(error).toBe("UserNotFound");
				},
			);
		});
	});

	describe("UserMods Service", () => {
		describe("createMod", () => {
			it("should create a new mod", async () => {
				const createData = {
					name: "Test Mod",
					category: ModCategory.MOD,
					description: "A test mod description",
				};

				const mod = await app.userMods.createMod(TEST_USER, createData);

				expect(mod.id).toBeDefined();
				expect(mod.name).toBe("Test Mod");
				expect(mod.category).toBe(ModCategory.MOD);
				expect(mod.description).toBe("A test mod description");
				expect(mod.visibility).toBe(ModVisibility.PRIVATE);
				expect(mod.maintainers).toContain(TEST_USER.id);
				expect(mod.downloadsCount).toBe(0);
			});

			it("should persist the mod in repository", async () => {
				const createData = {
					name: "Persisted Mod",
					category: ModCategory.TERRAIN,
					description: "Should be persisted",
				};

				const mod = await app.userMods.createMod(TEST_USER, createData);

				// Verify persistence using public API
				const findResult = await app.userMods.findById(TEST_USER, mod.id);
				expect(findResult.isOk()).toBe(true);
				findResult.match(
					(found) => {
						expect(found.id).toBe(mod.id);
					},
					() => {},
				);
			});
		});

		describe("findById", () => {
			it("should find mod by id for maintainer", async () => {
				const createData = {
					name: "Findable Mod",
					category: ModCategory.CAMPAIGN,
					description: "Should be findable",
				};

				const created = await app.userMods.createMod(TEST_USER, createData);
				const result = await app.userMods.findById(TEST_USER, created.id);

				expect(result.isOk()).toBe(true);
				result.match(
					(mod) => {
						expect(mod.id).toBe(created.id);
						expect(mod.name).toBe("Findable Mod");
					},
					() => {},
				);
			});

			it("should return ModNotFound for non-existent mod", async () => {
				const result = await app.userMods.findById(TEST_USER, "non-existent-mod");

				expect(result.isErr()).toBe(true);
				result.match(
					() => {},
					(error) => {
						expect(error).toBe("ModNotFound");
					},
				);
			});

			it("should return NotMaintainer when user is not a maintainer", async () => {
				const createData = {
					name: "Other User Mod",
					category: ModCategory.SOUND,
					description: "Owned by another user",
				};

				const created = await app.userMods.createMod(TEST_USER, createData);

				// Create another user
				const otherUser: UserData = {
					id: "other-user-id",
					username: "otheruser",
					avatarUrl: "https://example.com/other-avatar.png",
					profileUrl: "https://example.com/other-profile",
				};

				const result = await app.userMods.findById(otherUser, created.id);

				expect(result.isErr()).toBe(true);
				result.match(
					() => {},
					(error) => {
						expect(error).toBe("NotMaintainer");
					},
				);
			});
		});

		describe("updateMod", () => {
			it("should update an existing mod", async () => {
				const createData = {
					name: "Original Name",
					category: ModCategory.MOD,
					description: "Original description",
				};

				const created = await app.userMods.createMod(TEST_USER, createData);

				const result = await app.userMods.updateMod(TEST_USER, {
					id: created.id,
					name: "Updated Name",
					description: "Updated description",
					category: created.category,
					visibility: ModVisibility.PUBLIC,
					content: created.content,
					dependencies: [],
					maintainers: created.maintainers,
					screenshots: [],
					tags: ["tag1"],
					thumbnail: created.thumbnail,
				});

				expect(result.isOk()).toBe(true);
				result.match(
					(mod) => {
						expect(mod.name).toBe("Updated Name");
						expect(mod.description).toBe("Updated description");
						expect(mod.visibility).toBe(ModVisibility.PUBLIC);
					},
					() => {},
				);
			});
		});

		describe("deleteMod", () => {
			it("should delete an existing mod", async () => {
				const createData = {
					name: "To Be Deleted",
					category: ModCategory.SKIN,
					description: "Will be deleted",
				};

				const created = await app.userMods.createMod(TEST_USER, createData);
				const result = await app.userMods.deleteMod(TEST_USER, created.id);

				expect(result.isOk()).toBe(true);

				// Verify mod is gone using public API
				const findResult = await app.userMods.findById(TEST_USER, created.id);
				expect(findResult.isErr()).toBe(true);
			});

			it("should return ModNotFound for non-existent mod", async () => {
				const result = await app.userMods.deleteMod(TEST_USER, "non-existent");

				expect(result.isErr()).toBe(true);
				result.match(
					() => {},
					(error) => {
						expect(error).toBe("ModNotFound");
					},
				);
			});
		});

		describe("findAllMods", () => {
			it("should return all mods for maintainer with metadata", async () => {
				// Create multiple mods
				await app.userMods.createMod(TEST_USER, {
					name: "Mod 1",
					category: ModCategory.MOD,
					description: "First mod",
				});
				await app.userMods.createMod(TEST_USER, {
					name: "Mod 2",
					category: ModCategory.TERRAIN,
					description: "Second mod",
				});

				const result = await app.userMods.findAllMods(TEST_USER);

				expect(result.data.length).toBe(2);
				// Schema expects 'published' and 'totalDownloads'
				expect(result.meta.published).toBe(0); // Both are private by default
				expect(result.meta.totalDownloads).toBe(0);
			});
		});
	});

	describe("UserMods Service - Releases", () => {
		let modId: string;

		beforeEach(async () => {
			const createData = {
				name: "Mod with Releases",
				category: ModCategory.MOD,
				description: "A mod for testing releases",
			};

			const mod = await app.userMods.createMod(TEST_USER, createData);
			modId = mod.id;
		});

		describe("createRelease", () => {
			it("should create a new release for a mod", async () => {
				const result = await app.userMods.createRelease(TEST_USER, {
					modId,
					version: "1.0.0",
				});

				expect(result.isOk()).toBe(true);
				result.match(
					(release) => {
						expect(release.id).toBeDefined();
						expect(release.modId).toBe(modId);
						expect(release.version).toBe("1.0.0");
						expect(release.versionHash).toBeDefined();
						expect(release.visibility).toBe(ModVisibility.PUBLIC);
						expect(release.downloadsCount).toBe(0);
					},
					() => {},
				);
			});

			it("should persist the release in repository", async () => {
				const createResult = await app.userMods.createRelease(TEST_USER, {
					modId,
					version: "1.0.0",
				});

				expect(createResult.isOk()).toBe(true);
				const release = createResult._unsafeUnwrap();

				// Verify persistence using public API
				const findResult = await app.userMods.findReleaseById(TEST_USER, modId, release.id);
				expect(findResult.isOk()).toBe(true);
			});

			it("should return ModNotFound for non-existent mod", async () => {
				const result = await app.userMods.createRelease(TEST_USER, {
					modId: "non-existent",
					version: "1.0.0",
				});

				expect(result.isErr()).toBe(true);
				result.match(
					() => {},
					(error) => {
						expect(error).toBe("ModNotFound");
					},
				);
			});
		});

		describe("findReleaseById", () => {
			it("should find release by id", async () => {
				const createResult = await app.userMods.createRelease(TEST_USER, {
					modId,
					version: "1.0.0",
				});

				const releaseId = createResult._unsafeUnwrap().id;

				const result = await app.userMods.findReleaseById(TEST_USER, modId, releaseId);

				expect(result.isOk()).toBe(true);
				result.match(
					(release) => {
						expect(release.id).toBe(releaseId);
						expect(release.version).toBe("1.0.0");
					},
					() => {},
				);
			});
		});

		describe("findReleases", () => {
			it("should find all releases for a mod", async () => {
				await app.userMods.createRelease(TEST_USER, { modId, version: "1.0.0" });
				await app.userMods.createRelease(TEST_USER, { modId, version: "1.1.0" });

				const result = await app.userMods.findReleases(TEST_USER, modId);

				expect(result.isOk()).toBe(true);
				result.match(
					(releases) => {
						expect(releases.length).toBe(2);
					},
					() => {},
				);
			});
		});

		describe("updateRelease", () => {
			it("should update a release", async () => {
				const createResult = await app.userMods.createRelease(TEST_USER, {
					modId,
					version: "1.0.0",
				});

				const release = createResult._unsafeUnwrap();

				const result = await app.userMods.updateRelease(TEST_USER, {
					id: release.id,
					modId,
					version: "1.0.1",
					changelog: "Updated changelog",
					assets: [],
					symbolicLinks: [],
					missionScripts: [],
					visibility: ModVisibility.PUBLIC,
					downloadsCount: 0,
				});

				expect(result.isOk()).toBe(true);
				result.match(
					(updated) => {
						expect(updated.version).toBe("1.0.1");
						expect(updated.changelog).toBe("Updated changelog");
					},
					() => {},
				);
			});
		});

		describe("deleteRelease", () => {
			it("should delete a release", async () => {
				const createResult = await app.userMods.createRelease(TEST_USER, {
					modId,
					version: "1.0.0",
				});

				const releaseId = createResult._unsafeUnwrap().id;

				const result = await app.userMods.deleteRelease(TEST_USER, modId, releaseId);

				expect(result.isOk()).toBe(true);

				// Verify release is gone using public API
				const findResult = await app.userMods.findReleaseById(TEST_USER, modId, releaseId);
				expect(findResult.isErr()).toBe(true);
			});

			it("should return ReleaseNotFound for non-existent release", async () => {
				const result = await app.userMods.deleteRelease(TEST_USER, modId, "non-existent");

				expect(result.isErr()).toBe(true);
				result.match(
					() => {},
					(error) => {
						expect(error).toBe("ReleaseNotFound");
					},
				);
			});
		});
	});

	describe("PublicMods Service", () => {
		beforeEach(async () => {
			// Create some public mods for testing
			const mod1 = await app.userMods.createMod(TEST_USER, {
				name: "Public Mod 1",
				category: ModCategory.MOD,
				description: "First public mod",
			});

			// Make it public
			await app.userMods.updateMod(TEST_USER, {
				...mod1,
				visibility: ModVisibility.PUBLIC,
				tags: ["fighter", "modern"],
			});

			const mod2 = await app.userMods.createMod(TEST_USER, {
				name: "Public Mod 2",
				category: ModCategory.TERRAIN,
				description: "Second public mod",
			});

			await app.userMods.updateMod(TEST_USER, {
				...mod2,
				visibility: ModVisibility.PUBLIC,
				tags: ["armor"],
			});

			// Create a private mod
			await app.userMods.createMod(TEST_USER, {
				name: "Private Mod",
				category: ModCategory.SOUND,
				description: "Should not be visible",
			});
		});

		describe("getAllPublishedMods", () => {
			it("should return only public mods", async () => {
				const result = await app.publicMods.getAllPublishedMods({
					page: 1,
					size: 10,
				});

				expect(result.data.length).toBe(2);
				expect(result.page.totalElements).toBe(2);
			});

			it("should filter by category", async () => {
				const result = await app.publicMods.getAllPublishedMods({
					page: 1,
					size: 10,
					filter: { category: ModCategory.MOD },
				});

				expect(result.data.length).toBe(1);
				expect(result.data[0]!.category).toBe(ModCategory.MOD);
			});

			it("should support pagination", async () => {
				const result = await app.publicMods.getAllPublishedMods({
					page: 1,
					size: 1,
				});

				expect(result.data.length).toBe(1);
				expect(result.page.totalElements).toBe(2);
			});
		});

		describe("getModById", () => {
			it("should return a public mod with maintainers", async () => {
				// First get a list of public mods
				const allPublicMods = await app.publicMods.getAllPublishedMods({ page: 1, size: 10 });
				const publicMod = allPublicMods.data[0];
				expect(publicMod).toBeDefined();

				const result = await app.publicMods.getModById(publicMod!.id);

				expect(result.isOk()).toBe(true);
				result.match(
					({ mod, maintainers }) => {
						expect(mod.id).toBe(publicMod!.id);
						expect(maintainers).toEqual([TEST_USER]);
					},
					() => {},
				);
			});

			it("should return error for non-existent mod", async () => {
				const result = await app.publicMods.getModById("non-existent-mod-id");

				expect(result.isErr()).toBe(true);
			});
		});

		describe("getAllTags", () => {
			it("should return all tags from public mods", async () => {
				const tags = await app.publicMods.getAllTags();

				expect(tags).toContain("fighter");
				expect(tags).toContain("modern");
				expect(tags).toContain("armor");
			});
		});

		describe("getCategoryCounts", () => {
			it("should return counts for each category", async () => {
				const counts = await app.publicMods.getCategoryCounts();

				expect(counts[ModCategory.MOD]).toBe(1);
				expect(counts[ModCategory.TERRAIN]).toBe(1);
			});
		});

		describe("getServerMetrics", () => {
			it("should return total public mods and downloads", async () => {
				const metrics = await app.publicMods.getServerMetrics();

				expect(metrics.totalMods).toBe(2);
				expect(metrics.totalDownloads).toBe(0);
			});
		});
	});

	describe("PublicMods Service - Public Releases", () => {
		let publicModId: string;
		let publicReleaseId: string;

		beforeEach(async () => {
			// Create a public mod with a release
			const mod = await app.userMods.createMod(TEST_USER, {
				name: "Public Mod with Releases",
				category: ModCategory.MOD,
				description: "Has releases",
			});

			await app.userMods.updateMod(TEST_USER, {
				...mod,
				visibility: ModVisibility.PUBLIC,
			});

			publicModId = mod.id;

			const releaseResult = await app.userMods.createRelease(TEST_USER, {
				modId: publicModId,
				version: "1.0.0",
			});

			publicReleaseId = releaseResult._unsafeUnwrap().id;
		});

		describe("findPublicModReleases", () => {
			it("should return releases for a public mod", async () => {
				const result = await app.publicMods.findPublicModReleases(publicModId);

				expect(result.isOk()).toBe(true);
				result.match(
					(releases) => {
						expect(releases.length).toBe(1);
						expect(releases[0]!.version).toBe("1.0.0");
					},
					() => {},
				);
			});

			it("should return error for non-existent mod", async () => {
				const result = await app.publicMods.findPublicModReleases("non-existent");

				expect(result.isErr()).toBe(true);
			});
		});

		describe("findPublicModReleaseById", () => {
			it("should return a specific release", async () => {
				const result = await app.publicMods.findPublicModReleaseById(publicModId, publicReleaseId);

				expect(result.isOk()).toBe(true);
				result.match(
					(release) => {
						expect(release.id).toBe(publicReleaseId);
						expect(release.version).toBe("1.0.0");
					},
					() => {},
				);
			});
		});

		describe("findLatestPublicModRelease", () => {
			it("should return the latest release", async () => {
				const result = await app.publicMods.findLatestPublicModRelease(publicModId);

				expect(result.isOk()).toBe(true);
				result.match(
					(release) => {
						expect(release.id).toBe(publicReleaseId);
					},
					() => {},
				);
			});
		});

		describe("findUpdateInformationByIds", () => {
			it("should return update information for mods", async () => {
				const result = await app.publicMods.findUpdateInformationByIds([publicModId]);

				expect(result.length).toBe(1);
				expect(result[0]!.modId).toBe(publicModId);
				expect(result[0]!.version).toBe("1.0.0");
			});
		});
	});

	describe("Downloads Service", () => {
		let publicModId: string;
		let publicReleaseId: string;

		beforeEach(async () => {
			// Create a public mod with a release
			const mod = await app.userMods.createMod(TEST_USER, {
				name: "Downloadable Mod",
				category: ModCategory.MOD,
				description: "Can be downloaded",
			});

			await app.userMods.updateMod(TEST_USER, {
				...mod,
				visibility: ModVisibility.PUBLIC,
			});

			publicModId = mod.id;

			const releaseResult = await app.userMods.createRelease(TEST_USER, {
				modId: publicModId,
				version: "1.0.0",
			});

			publicReleaseId = releaseResult._unsafeUnwrap().id;
		});

		describe("registerModReleaseDownload", () => {
			it("should track unique daemon instances", async () => {
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-1");
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-2");
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-1"); // Duplicate

				expect(await app.downloads.getModDownloadCount(publicModId)).toBe(2);
			});
		});
	});

	describe("End-to-End: Full Mod Lifecycle", () => {
		it("should support creating, updating, releasing, and deleting a mod", async () => {
			// 1. Create a mod
			const mod = await app.userMods.createMod(TEST_USER, {
				name: "Lifecycle Test Mod",
				category: ModCategory.MOD,
				description: "Testing full lifecycle",
			});

			expect(mod.visibility).toBe(ModVisibility.PRIVATE);

			expect(await app.publicMods.getAllPublishedMods({ page: 1, size: 10, filter: {} })).toEqual({
				data: [],
				filter: {
					categories: [],
					maintainers: [],
					tags: [],
				},
				page: {
					number: 1,
					size: 10,
					totalElements: 0,
					totalPages: 1,
				},
			});

			// 2. Update mod to public
			const updateResult = await app.userMods.updateMod(TEST_USER, {
				...mod,
				visibility: ModVisibility.PUBLIC,
				tags: ["test", "e2e"],
			});
			expect(updateResult.isOk()).toBe(true);
			expect(await app.publicMods.getAllPublishedMods({ page: 1, size: 10, filter: {} })).toEqual({
				data: [
					{
						id: mod.id,
						name: "Lifecycle Test Mod",
						category: ModCategory.MOD,
						description: "Testing full lifecycle",
						downloadsCount: 0,
						dependencies: [],
						maintainers: ["test-user-id"],
						tags: ["test", "e2e"],
						thumbnail: "https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
					},
				],
				filter: {
					categories: [ModCategory.MOD],
					maintainers: [
						{
							id: TEST_USER.id,
							username: TEST_USER.username,
						},
					],
					tags: expect.arrayContaining(["e2e", "test"]),
				},
				page: {
					number: 1,
					size: 10,
					totalElements: 1,
					totalPages: 1,
				},
			});

			// 3. Create a release
			const releaseResult = await app.userMods.createRelease(TEST_USER, {
				modId: mod.id,
				version: "1.0.0",
			});
			expect(releaseResult.isOk()).toBe(true);

			const release = releaseResult._unsafeUnwrap();

			// 4. Verify mod is visible publicly
			const publicResult = await app.publicMods.getModById(mod.id);
			expect(publicResult.isOk()).toBe(true);

			// 5. Verify releases are visible publicly
			const releasesResult = await app.publicMods.findPublicModReleases(mod.id);
			expect(releasesResult.isOk()).toBe(true);

			// 6. Register a download
			await app.downloads.registerModReleaseDownload(mod.id, release.id, "test-daemon");
			expect(await app.downloads.getModDownloadCount(mod.id)).toBe(1);

			// 7. Verify server metrics include our mod
			const metrics = await app.publicMods.getServerMetrics();
			expect(metrics.totalMods).toEqual(1);

			// 8. Delete the release
			const deleteReleaseResult = await app.userMods.deleteRelease(TEST_USER, mod.id, release.id);
			expect(deleteReleaseResult.isOk()).toBe(true);

			// 9. Delete the mod
			const deleteModResult = await app.userMods.deleteMod(TEST_USER, mod.id);
			expect(deleteModResult.isOk()).toBe(true);

			// 10. Verify mod is no longer visible
			const finalResult = await app.publicMods.getModById(mod.id);
			expect(finalResult.isErr()).toBe(true);
		});
	});
});
