import "./log4js.ts";
import { beforeEach, describe, expect, it } from "bun:test";
import { err } from "neverthrow";
import { Linker } from "../Linker.ts";
import { SymlinkCreationFailed } from "../errors.ts";
import type { LinkDefinition } from "../types.ts";
import { TestLinkerFileSystem } from "./TestLinkerFileSystem.ts";

describe("Linker", () => {
	let fileSystem: TestLinkerFileSystem;
	let linker: Linker;

	beforeEach(() => {
		fileSystem = new TestLinkerFileSystem();
		linker = new Linker({ fileSystem });
	});

	describe("enable", () => {
		it("should create symlinks for all link definitions and return resolved links", async () => {
			const links: LinkDefinition[] = [
				{ id: "link-1", src: "/mods/release-1/file.lua", dest: "/dcs/Scripts/file.lua" },
				{ id: "link-2", src: "/mods/release-1/dir", dest: "/dcs/Mods/dir" },
			];

			const result = await linker.enable(links);

			expect(result.isOk()).toBe(true);
			const resolved = result._unsafeUnwrap();
			expect(resolved.length).toEqual(2);
			expect(resolved[0]?.id).toBe("link-1");
			expect(resolved[0]?.src).toBe("/mods/release-1/file.lua");
			expect(resolved[0]?.dest).toBe("/dcs/Scripts/file.lua");
			expect(resolved[1]?.id).toBe("link-2");

			expect(fileSystem.hasSymlink("/dcs/Scripts/file.lua")).toBe(true);
			expect(fileSystem.hasSymlink("/dcs/Mods/dir")).toBe(true);
		});

		it("should return an empty array when no links are provided", async () => {
			const result = await linker.enable([]);

			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual([]);
		});

		it("should return SymlinkCreationFailed when symlink creation fails", async () => {
			fileSystem.symlinkError = new Error("permission denied");

			const links: LinkDefinition[] = [
				{ id: "link-1", src: "/mods/release-1/file.lua", dest: "/dcs/Scripts/file.lua" },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr()).toBeInstanceOf(SymlinkCreationFailed);
			expect(result._unsafeUnwrapErr().type).toBe("SymlinkCreationFailed");
		});

		it("should rollback previously created symlinks when a subsequent link fails", async () => {
			let callCount = 0;
			const originalEnsureSymlink = fileSystem.ensureSymlink.bind(fileSystem);
			fileSystem.ensureSymlink = async (src: string, dest: string) => {
				callCount++;
				if (callCount === 2) {
					return err(new Error("UAC elevation denied"));
				}
				return originalEnsureSymlink(src, dest);
			};

			const links: LinkDefinition[] = [
				{ id: "link-1", src: "/mods/release-1/first.lua", dest: "/dcs/Scripts/first.lua" },
				{ id: "link-2", src: "/mods/release-1/second.lua", dest: "/dcs/Scripts/second.lua" },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr()).toBeInstanceOf(SymlinkCreationFailed);

			// First symlink should have been rolled back
			expect(fileSystem.hasSymlink("/dcs/Scripts/first.lua")).toBe(false);
			// Second symlink was never created
			expect(fileSystem.hasSymlink("/dcs/Scripts/second.lua")).toBe(false);
		});

		it("should include the failing link id in the error message", async () => {
			fileSystem.symlinkError = new Error("access denied");

			const links: LinkDefinition[] = [
				{ id: "my-special-link", src: "/mods/file.lua", dest: "/dcs/file.lua" },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr().message).toContain("my-special-link");
		});
	});

	describe("disable", () => {
		it("should remove symlinks at installed paths and return removed IDs", async () => {
			// First enable some links
			const links: LinkDefinition[] = [
				{ id: "link-1", src: "/mods/release-1/file.lua", dest: "/dcs/Scripts/file.lua" },
				{ id: "link-2", src: "/mods/release-1/dir", dest: "/dcs/Mods/dir" },
			];
			await linker.enable(links);

			expect(fileSystem.hasSymlink("/dcs/Scripts/file.lua")).toBe(true);
			expect(fileSystem.hasSymlink("/dcs/Mods/dir")).toBe(true);

			// Now disable
			const removed = linker.disable([
				{ id: "link-1", installedPath: "/dcs/Scripts/file.lua" },
				{ id: "link-2", installedPath: "/dcs/Mods/dir" },
			]);

			expect(removed).toEqual(["link-1", "link-2"]);
			expect(fileSystem.hasSymlink("/dcs/Scripts/file.lua")).toBe(false);
			expect(fileSystem.hasSymlink("/dcs/Mods/dir")).toBe(false);
		});

		it("should handle empty link list without error", () => {
			expect(() => linker.disable([])).not.toThrow();
		});
	});
});
