import { describe, expect, test } from "bun:test";
import { SevenzipService } from "./SevenzipService.ts";

describe("Sevenzip Service", () => {
	test("should throw error if 7z executable not found", () => {
		expect(
			() =>
				new SevenzipService({
					exePath: "nonexistent/7za.exe",
				}),
		).toThrow("7z executable not found at path");
	});

	test("should throw error if 7z executable path is a directory", () => {
		expect(
			() =>
				new SevenzipService({
					exePath: "binaries",
				}),
		).toThrow("7z executable path is a directory");
	});

	test("should create service successfully with valid path", () => {
		const service = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		expect(service).toBeDefined();
	});
});
