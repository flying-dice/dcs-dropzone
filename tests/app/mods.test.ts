import { beforeEach, describe, expect, test } from "bun:test";
import {
	type CreateMod,
	DEFAULT_MOD_CONTENT,
	type Mod,
	type ModSummary,
	type UpdateMod,
} from "../../src/app/server/domain/mod.schema.ts";
import type { ModRepository } from "../../src/app/server/repositories/mod.repository.ts";
import { ModService } from "../../src/app/server/services/mod.service.ts";

// Mock data
const mockMod: Mod = {
	id: "test-mod",
	homepage: "https://example.com",
	name: "Test Mod",
	description: "A test mod for testing",
	authors: ["Test Author"],
	maintainers: ["user123"],
	tags: ["test"],
	category: "Test",
	license: "MIT License",
	latest: "1.0.0",
	dependencies: [],
	versions: [
		{
			releasepage: "https://example.com/releases/1.0.0",
			name: "v1.0.0",
			version: "1.0.0",
			date: new Date("2024-01-01"),
			assets: [],
		},
	],
	imageUrl: "https://example.com/image.png",
	content: "Test content",
	published: true,
};

const mockModSummary: ModSummary = {
	id: mockMod.id,
	homepage: mockMod.homepage,
	name: mockMod.name,
	description: mockMod.description,
	authors: mockMod.authors,
	maintainers: mockMod.maintainers,
	tags: mockMod.tags,
	category: mockMod.category,
	license: mockMod.license,
	latest: mockMod.latest,
	dependencies: mockMod.dependencies,
	imageUrl: mockMod.imageUrl,
	published: mockMod.published,
};

// Mock repository
class MockModRepository implements ModRepository {
	private mods = new Map<string, Mod>();

	async findById(id: string): Promise<Mod | undefined> {
		return this.mods.get(id);
	}

	async findAll(): Promise<ModSummary[]> {
		return Array.from(this.mods.values()).map((mod) => {
			// biome-ignore lint/correctness/noUnusedVariables: Using destructuring to omit fields
			const { content, versions, ...summary } = mod;
			return summary;
		});
	}

	async findByMaintainer(userId: string): Promise<ModSummary[]> {
		return Array.from(this.mods.values())
			.filter((mod) => mod.maintainers.includes(userId))
			.map((mod) => {
				// biome-ignore lint/correctness/noUnusedVariables: Using destructuring to omit fields
				const { content, versions, ...summary } = mod;
				return summary;
			});
	}

	async create(mod: CreateMod): Promise<Mod> {
		const newMod: Mod = {
			...mod,
			tags: mod.tags || [],
			category: mod.category || "Uncategorized",
			license: mod.license || "MIT License",
			dependencies: mod.dependencies || [],
			versions: mod.versions || [],
			content: mod.content || DEFAULT_MOD_CONTENT,
			published: mod.published || false,
		};
		this.mods.set(newMod.id, newMod);
		return newMod;
	}

	async update(id: string, updates: UpdateMod): Promise<Mod | undefined> {
		const mod = this.mods.get(id);
		if (!mod) return undefined;
		const updatedMod = { ...mod, ...updates };
		this.mods.set(id, updatedMod);
		return updatedMod;
	}

	async delete(id: string): Promise<boolean> {
		return this.mods.delete(id);
	}

	async exists(id: string): Promise<boolean> {
		return this.mods.has(id);
	}

	// Helper methods for testing
	clear(): void {
		this.mods.clear();
	}

	seed(mod: Mod): void {
		this.mods.set(mod.id, mod);
	}
}

describe("ModService", () => {
	let repository: MockModRepository;
	let service: ModService;

	beforeEach(() => {
		repository = new MockModRepository();
		service = new ModService(repository);
	});

	describe("getModById", () => {
		test("should return mod when it exists", async () => {
			repository.seed(mockMod);
			const result = await service.getModById("test-mod");
			expect(result).toEqual(mockMod);
		});

		test("should return undefined when mod does not exist", async () => {
			const result = await service.getModById("non-existent");
			expect(result).toBeUndefined();
		});
	});

	describe("getAllMods", () => {
		test("should return empty array when no mods exist", async () => {
			const result = await service.getAllMods();
			expect(result).toEqual([]);
		});

		test("should return all mods as summaries", async () => {
			repository.seed(mockMod);
			const result = await service.getAllMods();
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockModSummary);
		});
	});

	describe("getModsByMaintainer", () => {
		test("should return mods maintained by user", async () => {
			repository.seed(mockMod);
			const result = await service.getModsByMaintainer("user123");
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("test-mod");
		});

		test("should return empty array when user has no mods", async () => {
			repository.seed(mockMod);
			const result = await service.getModsByMaintainer("other-user");
			expect(result).toEqual([]);
		});
	});

	describe("createMod", () => {
		test("should create a new mod successfully", async () => {
			const createData = {
				id: "new-mod",
				homepage: "https://example.com",
				name: "New Mod",
				description: "A new mod",
				authors: ["Author"],
				maintainers: ["user123"],
			};

			const result = await service.createMod(createData, "user123");

			expect(result.id).toBe("new-mod");
			expect(result.name).toBe("New Mod");
			expect(result.maintainers).toContain("user123");
		});

		test("should add creator to maintainers if not present", async () => {
			const createData = {
				id: "new-mod",
				homepage: "https://example.com",
				name: "New Mod",
				description: "A new mod",
				authors: ["Author"],
				maintainers: ["other-user"],
			};

			const result = await service.createMod(createData, "creator123");

			expect(result.maintainers).toContain("creator123");
			expect(result.maintainers).toContain("other-user");
		});

		test("should throw error when mod already exists", async () => {
			repository.seed(mockMod);

			const createData = {
				id: "test-mod",
				homepage: "https://example.com",
				name: "Duplicate",
				description: "Duplicate",
				authors: ["Author"],
				maintainers: ["user123"],
			};

			await expect(service.createMod(createData, "user123")).rejects.toThrow(
				"Mod with id 'test-mod' already exists",
			);
		});
	});

	describe("updateMod", () => {
		test("should update mod successfully when user is maintainer", async () => {
			repository.seed(mockMod);

			const updates = { name: "Updated Name" };
			const result = await service.updateMod("test-mod", updates, "user123");

			expect(result?.name).toBe("Updated Name");
		});

		test("should return undefined when mod does not exist", async () => {
			const result = await service.updateMod("non-existent", {}, "user123");
			expect(result).toBeUndefined();
		});

		test("should throw error when user is not a maintainer", async () => {
			repository.seed(mockMod);

			await expect(
				service.updateMod("test-mod", { name: "Hacked" }, "hacker"),
			).rejects.toThrow("User is not a maintainer of this mod");
		});
	});

	describe("deleteMod", () => {
		test("should delete mod successfully when user is maintainer", async () => {
			repository.seed(mockMod);

			const result = await service.deleteMod("test-mod", "user123");
			expect(result).toBe(true);

			const mod = await service.getModById("test-mod");
			expect(mod).toBeUndefined();
		});

		test("should return false when mod does not exist", async () => {
			const result = await service.deleteMod("non-existent", "user123");
			expect(result).toBe(false);
		});

		test("should throw error when user is not a maintainer", async () => {
			repository.seed(mockMod);

			await expect(service.deleteMod("test-mod", "hacker")).rejects.toThrow(
				"User is not a maintainer of this mod",
			);
		});
	});

	describe("modExists", () => {
		test("should return true when mod exists", async () => {
			repository.seed(mockMod);
			const result = await service.modExists("test-mod");
			expect(result).toBe(true);
		});

		test("should return false when mod does not exist", async () => {
			const result = await service.modExists("non-existent");
			expect(result).toBe(false);
		});
	});
});
