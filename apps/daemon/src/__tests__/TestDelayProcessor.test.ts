import { describe, expect, it, mock } from "bun:test";
import { TestDelayProcessor } from "./TestDelayProcessor.ts";

describe("TestDownloadProcessor", () => {
	const processor = new TestDelayProcessor("test");

	it("processes download job successfully and returns file path", async () => {
		const abortController = new AbortController();
		const progressHandler = mock();

		const mockContext = {
			abortSignal: abortController.signal,
			updateProgress: progressHandler,
		};

		const [result, resultErr] = await processor.process({}, mockContext);

		expect(resultErr).toBeNull();
		expect(mockContext.updateProgress).toHaveBeenCalledTimes(4);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(25);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(50);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(75);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(100);

		expect(result).toEqual({});
	});

	it("handles abort signal during processing", async () => {
		const abortController = new AbortController();
		const progressHandler = mock();

		const mockContext = {
			abortSignal: abortController.signal,
			updateProgress: progressHandler,
		};

		const result = processor.process({}, mockContext);
		abortController.abort();
		expect(result).rejects.toThrow();
	});
});
