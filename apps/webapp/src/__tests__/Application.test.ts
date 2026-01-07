import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ModCategory } from "../application/enums/ModCategory.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { UserData } from "../application/schemas/UserData.ts";
import { TestApplication } from "./TestApplication.ts";

describe("Application", () => {
	let app: TestApplication;
	let testUser: UserData;

	beforeEach(async () => {
		app = new TestApplication();

		// Create a test user via the authenticator flow
		const authResult = await app.authenticator.handleAuthCallback("test-code", "test-state");
		const user = await app.authenticator.handleAuthResult(authResult);
		testUser = user;

		// Also set the user in the mod repository for maintainer lookups
		app.testModRepository.setUser({ id: testUser.id, username: testUser.username });
	});

	afterEach(() => {
		app.clear();
	});

	describe("Users Service", () => {
		it("should get user by id", async () => {
			const result = await app.users.getUserById(testUser.id);

			expect(result.isOk()).toBe(true);
			result.match(
				(user) => {
					expect(user.id).toBe(testUser.id);
					expect(user.username).toBe(testUser.username);
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

	describe("WebFlowAuthenticator", () => {
		it("should return authorization URL", () => {
			const url = app.authenticator.getWebFlowAuthorizationUrl();
			expect(url).toBeDefined();
			expect(typeof url).toBe("string");
		});

		it("should handle auth callback and create user", async () => {
			app.testAuthProvider.setNextAuthResult({
				id: "new-user-id",
				username: "newuser",
				name: "New User",
				avatarUrl: "https://example.com/new-avatar.png",
				profileUrl: "https://example.com/new-profile",
			});

			const authResult = await app.authenticator.handleAuthCallback("code", "state");
			const user = await app.authenticator.handleAuthResult(authResult);

			expect(user.id).toBe("new-user-id");
			expect(user.username).toBe("newuser");

			// Verify user was saved
			const savedUsers = app.testUserRepository.getAllUsers();
			expect(savedUsers.length).toBe(2); // Original test user + new user
			expect(savedUsers.some((u) => u.id === "new-user-id")).toBe(true);
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

				const mod = await app.userMods.createMod(testUser, createData);

				expect(mod.id).toBeDefined();
				expect(mod.name).toBe("Test Mod");
				expect(mod.category).toBe(ModCategory.MOD);
				expect(mod.description).toBe("A test mod description");
				expect(mod.visibility).toBe(ModVisibility.PRIVATE);
				expect(mod.maintainers).toContain(testUser.id);
				expect(mod.downloadsCount).toBe(0);
			});

			it("should persist the mod in repository", async () => {
				const createData = {
					name: "Persisted Mod",
					category: ModCategory.TERRAIN,
					description: "Should be persisted",
				};

				const mod = await app.userMods.createMod(testUser, createData);

				const allMods = app.testModRepository.getAllMods();
				expect(allMods.length).toBe(1);
				expect(allMods[0]!.id).toBe(mod.id);
			});
		});

		describe("findById", () => {
			it("should find mod by id for maintainer", async () => {
				const createData = {
					name: "Findable Mod",
					category: ModCategory.CAMPAIGN,
					description: "Should be findable",
				};

				const created = await app.userMods.createMod(testUser, createData);
				const result = await app.userMods.findById(testUser, created.id);

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
				const result = await app.userMods.findById(testUser, "non-existent-mod");

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

				const created = await app.userMods.createMod(testUser, createData);

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

				const created = await app.userMods.createMod(testUser, createData);

				const result = await app.userMods.updateMod(testUser, {
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

				const created = await app.userMods.createMod(testUser, createData);
				const result = await app.userMods.deleteMod(testUser, created.id);

				expect(result.isOk()).toBe(true);

				// Verify mod is gone
				const allMods = app.testModRepository.getAllMods();
				expect(allMods.length).toBe(0);
			});

			it("should return ModNotFound for non-existent mod", async () => {
				const result = await app.userMods.deleteMod(testUser, "non-existent");

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
				await app.userMods.createMod(testUser, {
					name: "Mod 1",
					category: ModCategory.MOD,
					description: "First mod",
				});
				await app.userMods.createMod(testUser, {
					name: "Mod 2",
					category: ModCategory.TERRAIN,
					description: "Second mod",
				});

				const result = await app.userMods.findAllMods(testUser);

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

			const mod = await app.userMods.createMod(testUser, createData);
			modId = mod.id;
		});

		describe("createRelease", () => {
			it("should create a new release for a mod", async () => {
				const result = await app.userMods.createRelease(testUser, {
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
				await app.userMods.createRelease(testUser, {
					modId,
					version: "1.0.0",
				});

				const allReleases = app.testModRepository.getAllReleases();
				expect(allReleases.length).toBe(1);
			});

			it("should return ModNotFound for non-existent mod", async () => {
				const result = await app.userMods.createRelease(testUser, {
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
				const createResult = await app.userMods.createRelease(testUser, {
					modId,
					version: "1.0.0",
				});

				const releaseId = createResult._unsafeUnwrap().id;

				const result = await app.userMods.findReleaseById(testUser, modId, releaseId);

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
				await app.userMods.createRelease(testUser, { modId, version: "1.0.0" });
				await app.userMods.createRelease(testUser, { modId, version: "1.1.0" });

				const result = await app.userMods.findReleases(testUser, modId);

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
				const createResult = await app.userMods.createRelease(testUser, {
					modId,
					version: "1.0.0",
				});

				const release = createResult._unsafeUnwrap();

				const result = await app.userMods.updateRelease(testUser, {
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
				const createResult = await app.userMods.createRelease(testUser, {
					modId,
					version: "1.0.0",
				});

				const releaseId = createResult._unsafeUnwrap().id;

				const result = await app.userMods.deleteRelease(testUser, modId, releaseId);

				expect(result.isOk()).toBe(true);

				// Verify release is gone
				const allReleases = app.testModRepository.getAllReleases();
				expect(allReleases.length).toBe(0);
			});

			it("should return ReleaseNotFound for non-existent release", async () => {
				const result = await app.userMods.deleteRelease(testUser, modId, "non-existent");

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
			const mod1 = await app.userMods.createMod(testUser, {
				name: "Public Mod 1",
				category: ModCategory.MOD,
				description: "First public mod",
			});

			// Make it public
			await app.userMods.updateMod(testUser, {
				...mod1,
				visibility: ModVisibility.PUBLIC,
				tags: ["fighter", "modern"],
			});

			const mod2 = await app.userMods.createMod(testUser, {
				name: "Public Mod 2",
				category: ModCategory.TERRAIN,
				description: "Second public mod",
			});

			await app.userMods.updateMod(testUser, {
				...mod2,
				visibility: ModVisibility.PUBLIC,
				tags: ["armor"],
			});

			// Create a private mod
			await app.userMods.createMod(testUser, {
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
				const allMods = app.testModRepository.getAllMods();
				const publicMod = allMods.find((m) => m.visibility === ModVisibility.PUBLIC);

				const result = await app.publicMods.getModById(publicMod!.id);

				expect(result.isOk()).toBe(true);
				result.match(
					({ mod, maintainers }) => {
						expect(mod.id).toBe(publicMod!.id);
						expect(maintainers.length).toBeGreaterThan(0);
					},
					() => {},
				);
			});

			it("should return error for private mod", async () => {
				const allMods = app.testModRepository.getAllMods();
				const privateMod = allMods.find((m) => m.visibility === ModVisibility.PRIVATE);

				const result = await app.publicMods.getModById(privateMod!.id);

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
			const mod = await app.userMods.createMod(testUser, {
				name: "Public Mod with Releases",
				category: ModCategory.MOD,
				description: "Has releases",
			});

			await app.userMods.updateMod(testUser, {
				...mod,
				visibility: ModVisibility.PUBLIC,
			});

			publicModId = mod.id;

			const releaseResult = await app.userMods.createRelease(testUser, {
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
			const mod = await app.userMods.createMod(testUser, {
				name: "Downloadable Mod",
				category: ModCategory.MOD,
				description: "Can be downloaded",
			});

			await app.userMods.updateMod(testUser, {
				...mod,
				visibility: ModVisibility.PUBLIC,
			});

			publicModId = mod.id;

			const releaseResult = await app.userMods.createRelease(testUser, {
				modId: publicModId,
				version: "1.0.0",
			});

			publicReleaseId = releaseResult._unsafeUnwrap().id;
		});

		describe("registerModReleaseDownload", () => {
			it("should register a download", async () => {
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-instance-1");

				// Verify download was recorded
				const downloadCount = await app.testDownloadsRepository.getModReleaseDownloadCount(
					publicModId,
					publicReleaseId,
				);
				expect(downloadCount).toBe(1);
			});

			it("should track unique daemon instances", async () => {
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-1");
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-2");
				await app.downloads.registerModReleaseDownload(publicModId, publicReleaseId, "daemon-1"); // Duplicate

				const downloadCount = await app.testDownloadsRepository.getModReleaseDownloadCount(
					publicModId,
					publicReleaseId,
				);
				expect(downloadCount).toBe(2); // Only unique instances
			});
		});
	});

	describe("End-to-End: Full Mod Lifecycle", () => {
		it("should support creating, updating, releasing, and deleting a mod", async () => {
			// 1. Create a mod
			const mod = await app.userMods.createMod(testUser, {
				name: "Lifecycle Test Mod",
				category: ModCategory.MOD,
				description: "Testing full lifecycle",
			});

			expect(mod.visibility).toBe(ModVisibility.PRIVATE);

			// 2. Update mod to public
			const updateResult = await app.userMods.updateMod(testUser, {
				...mod,
				visibility: ModVisibility.PUBLIC,
				tags: ["test", "e2e"],
			});
			expect(updateResult.isOk()).toBe(true);

			// 3. Create a release
			const releaseResult = await app.userMods.createRelease(testUser, {
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

			// 7. Verify server metrics include our mod
			const metrics = await app.publicMods.getServerMetrics();
			expect(metrics.totalMods).toBeGreaterThan(0);

			// 8. Delete the release
			const deleteReleaseResult = await app.userMods.deleteRelease(testUser, mod.id, release.id);
			expect(deleteReleaseResult.isOk()).toBe(true);

			// 9. Delete the mod
			const deleteModResult = await app.userMods.deleteMod(testUser, mod.id);
			expect(deleteModResult.isOk()).toBe(true);

			// 10. Verify mod is no longer visible
			const finalResult = await app.publicMods.getModById(mod.id);
			expect(finalResult.isErr()).toBe(true);
		});
	});
});
