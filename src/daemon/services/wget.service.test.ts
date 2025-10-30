import { describe, expect, mock, test } from "bun:test";
import { WgetService } from "./wget.service.ts";

describe("Wget Service", () => {
	test("should download a file successfully", async () => {
		const service = new WgetService({
			exePath: "binaries/wget.exe",
		});

		const onProgress = mock();

		const result = await service.download({
			url: "http://ipv4.download.thinkbroadband.com/100MB.zip",
			target: "./.test-downloads",
			onProgress,
		});

		expect(result).toEndWith(".test-downloads\\100MB.zip");
		expect(onProgress).toHaveBeenLastCalledWith({ progress: 100 });
	});

	test("should fail to download a file with invalid URL", async () => {
		const service = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const onProgress = mock();

		expect(
			service.download({
				url: "http://ipv4.download.thinkbroadband.com/404MB.zip",
				target: "./.test-downloads",
				onProgress,
			}),
		).rejects.toThrow("Failed to download file");
	});
});
