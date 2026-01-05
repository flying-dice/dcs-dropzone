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

		const result = await processor.process({}, mockContext);

		expect(result.isOk()).toBe(true);
		expect(mockContext.updateProgress).toHaveBeenCalledTimes(4);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(25);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(50);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(75);
		expect(mockContext.updateProgress).toHaveBeenCalledWith(100);

		result.match(
			(res) => {
				expect(res).toEqual({});
			},
			(err) => {
				throw new Error(`Expected success but got error: ${err}`);
			},
		);
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
