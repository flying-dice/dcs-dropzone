import "./log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LinkerErrorCode, RemovalFailed, SymlinkCreationFailed } from "../errors.ts";
import { Linker } from "../Linker.ts";
import type { LinkDefinition } from "../types.ts";

describe("Linker", () => {
	let tempDir: string;
	let srcDir: string;
	let destDir: string;
	let linker: Linker;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "linker-test-"));
		srcDir = join(tempDir, "src");
		destDir = join(tempDir, "dest");
		mkdirSync(srcDir, { recursive: true });
		mkdirSync(destDir, { recursive: true });
		linker = new Linker();
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	describe("enable", () => {
		it("should create symlinks for all link definitions and return resolved links", async () => {
			writeFileSync(join(srcDir, "test.lua"), 'print("hello")');

			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "test.lua"), dest: join(destDir, "test.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isOk()).toBe(true);
			const resolved = result._unsafeUnwrap();
			expect(resolved.length).toEqual(1);
			expect(resolved[0]?.id).toBe("link-1");
			expect(resolved[0]?.src).toBe(join(srcDir, "test.lua"));
			expect(resolved[0]?.dest).toBe(join(destDir, "test.lua"));

			expect(existsSync(join(destDir, "test.lua"))).toBe(true);
		});

		it("should create symlinks for multiple files", async () => {
			writeFileSync(join(srcDir, "first.lua"), "first");
			writeFileSync(join(srcDir, "second.lua"), "second");

			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "first.lua"), dest: join(destDir, "first.lua") },
				{ id: "link-2", src: join(srcDir, "second.lua"), dest: join(destDir, "second.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isOk()).toBe(true);
			const resolved = result._unsafeUnwrap();
			expect(resolved.length).toEqual(2);
			expect(existsSync(join(destDir, "first.lua"))).toBe(true);
			expect(existsSync(join(destDir, "second.lua"))).toBe(true);
		});

		it("should create symlinks for directories", async () => {
			const subDir = join(srcDir, "mymod");
			mkdirSync(subDir);
			writeFileSync(join(subDir, "init.lua"), "mod init");

			const links: LinkDefinition[] = [{ id: "link-1", src: subDir, dest: join(destDir, "mymod") }];

			const result = await linker.enable(links);

			expect(result.isOk()).toBe(true);
			expect(existsSync(join(destDir, "mymod", "init.lua"))).toBe(true);
		});

		it("should create parent directories for dest if they do not exist", async () => {
			writeFileSync(join(srcDir, "test.lua"), "content");
			const nestedDest = join(destDir, "deep", "nested", "test.lua");

			const links: LinkDefinition[] = [{ id: "link-1", src: join(srcDir, "test.lua"), dest: nestedDest }];

			const result = await linker.enable(links);

			expect(result.isOk()).toBe(true);
			expect(existsSync(nestedDest)).toBe(true);
		});

		it("should return an empty array when no links are provided", async () => {
			const result = await linker.enable([]);

			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual([]);
		});

		it("should return SourceNotFound error when source does not exist", async () => {
			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "nonexistent.lua"), dest: join(destDir, "test.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			const error = result._unsafeUnwrapErr();
			expect(error).toBeInstanceOf(SymlinkCreationFailed);
			expect(error.type).toBe("SymlinkCreationFailed");
			expect(error.linkId).toBe("link-1");
			expect(error.code).toBe(LinkerErrorCode.SourceNotFound);
		});

		it("should return LinkAlreadyExists error when dest already exists", async () => {
			writeFileSync(join(srcDir, "test.lua"), "content");
			writeFileSync(join(destDir, "test.lua"), "existing content");

			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "test.lua"), dest: join(destDir, "test.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			const error = result._unsafeUnwrapErr();
			expect(error).toBeInstanceOf(SymlinkCreationFailed);
			expect(error.code).toBe(LinkerErrorCode.LinkAlreadyExists);
			expect(error.linkId).toBe("link-1");
		});

		it("should rollback previously created symlinks when a subsequent link fails", async () => {
			writeFileSync(join(srcDir, "first.lua"), "first");
			// second.lua does NOT exist → will fail

			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "first.lua"), dest: join(destDir, "first.lua") },
				{ id: "link-2", src: join(srcDir, "nonexistent.lua"), dest: join(destDir, "second.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			const error = result._unsafeUnwrapErr();
			expect(error.linkId).toBe("link-2");
			expect(error.code).toBe(LinkerErrorCode.SourceNotFound);

			// First symlink should have been rolled back
			expect(existsSync(join(destDir, "first.lua"))).toBe(false);
			// Second symlink was never created
			expect(existsSync(join(destDir, "second.lua"))).toBe(false);
		});

		it("should return PermissionDenied error when dest directory is not writable", async () => {
			// chmod 000 is not applicable on Windows; root bypasses permission bits
			if (platform() === "win32" || process.getuid?.() === 0) return;

			writeFileSync(join(srcDir, "test.lua"), "content");
			const readonlyDir = join(tempDir, "readonly");
			mkdirSync(readonlyDir);
			chmodSync(readonlyDir, 0o000);

			const links: LinkDefinition[] = [
				{ id: "link-1", src: join(srcDir, "test.lua"), dest: join(readonlyDir, "test.lua") },
			];

			try {
				const result = await linker.enable(links);

				expect(result.isErr()).toBe(true);
				const error = result._unsafeUnwrapErr();
				expect(error).toBeInstanceOf(SymlinkCreationFailed);
				expect(error.linkId).toBe("link-1");
				expect(error.code).toBe(LinkerErrorCode.PermissionDenied);
			} finally {
				// Restore permissions so afterEach cleanup can delete the directory
				chmodSync(readonlyDir, 0o755);
			}
		});

		it("should include the failing link id in the error", async () => {
			const links: LinkDefinition[] = [
				{ id: "my-special-link", src: join(srcDir, "nope.lua"), dest: join(destDir, "test.lua") },
			];

			const result = await linker.enable(links);

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr().linkId).toBe("my-special-link");
			expect(result._unsafeUnwrapErr().message).toContain("my-special-link");
		});
	});

	describe("disable", () => {
		it("should remove symlinks at installed paths and return ok with removed IDs", async () => {
			writeFileSync(join(srcDir, "file.lua"), "content");
			await linker.enable([{ id: "link-1", src: join(srcDir, "file.lua"), dest: join(destDir, "file.lua") }]);

			expect(existsSync(join(destDir, "file.lua"))).toBe(true);

			const result = linker.disable([{ id: "link-1", installedPath: join(destDir, "file.lua") }]);

			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual(["link-1"]);
			expect(existsSync(join(destDir, "file.lua"))).toBe(false);
		});

		it("should remove multiple symlinks", async () => {
			writeFileSync(join(srcDir, "a.lua"), "a");
			writeFileSync(join(srcDir, "b.lua"), "b");
			await linker.enable([
				{ id: "link-a", src: join(srcDir, "a.lua"), dest: join(destDir, "a.lua") },
				{ id: "link-b", src: join(srcDir, "b.lua"), dest: join(destDir, "b.lua") },
			]);

			const result = linker.disable([
				{ id: "link-a", installedPath: join(destDir, "a.lua") },
				{ id: "link-b", installedPath: join(destDir, "b.lua") },
			]);

			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual(["link-a", "link-b"]);
			expect(existsSync(join(destDir, "a.lua"))).toBe(false);
			expect(existsSync(join(destDir, "b.lua"))).toBe(false);
		});

		it("should treat absent installed path as already removed", () => {
			const result = linker.disable([{ id: "link-1", installedPath: join(destDir, "nonexistent") }]);

			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual(["link-1"]);
		});

		it("should handle empty link list without error", () => {
			const result = linker.disable([]);
			expect(result.isOk()).toBe(true);
			expect(result._unsafeUnwrap()).toEqual([]);
		});

		it("should return err with removed and failed lists when a removal fails", () => {
			// chmod 000 is not applicable on Windows; root bypasses permission bits
			if (platform() === "win32" || process.getuid?.() === 0) return;

			writeFileSync(join(srcDir, "keep.lua"), "content");
			writeFileSync(join(destDir, "keep.lua"), "file to remove");

			const readonlyDir = join(tempDir, "readonly-dest");
			mkdirSync(readonlyDir);
			writeFileSync(join(readonlyDir, "locked.lua"), "locked");
			// Make the parent readonly so rmSync cannot remove the file inside
			chmodSync(readonlyDir, 0o000);

			try {
				const result = linker.disable([
					{ id: "link-keep", installedPath: join(destDir, "keep.lua") },
					{ id: "link-locked", installedPath: join(readonlyDir, "locked.lua") },
				]);

				expect(result.isErr()).toBe(true);
				const outcome = result._unsafeUnwrapErr();
				expect(outcome.removed).toEqual(["link-keep"]);
				expect(outcome.failed).toHaveLength(1);
				expect(outcome.failed[0]).toBeInstanceOf(RemovalFailed);
				expect(outcome.failed[0]?.linkId).toBe("link-locked");
			} finally {
				chmodSync(readonlyDir, 0o755);
			}
		});
	});
});
