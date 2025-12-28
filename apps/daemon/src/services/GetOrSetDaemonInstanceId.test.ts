import { beforeEach, describe, expect, it, mock } from "bun:test";
import { GetOrSetDaemonInstanceId } from "./GetOrSetDaemonInstanceId";

describe("GetOrSetDaemonInstanceId", () => {
	let mockGetDaemonInstanceId: any;
	let mockSaveDaemonInstanceId: any;
	let mockGenerateUuid: any;
	let getOrSetDaemonInstanceId: GetOrSetDaemonInstanceId;

	beforeEach(() => {
		mockGetDaemonInstanceId = { execute: mock() };
		mockSaveDaemonInstanceId = { execute: mock() };
		mockGenerateUuid = mock();

		getOrSetDaemonInstanceId = new GetOrSetDaemonInstanceId({
			getDaemonInstanceId: mockGetDaemonInstanceId,
			saveDaemonInstanceId: mockSaveDaemonInstanceId,
			generateUuid: mockGenerateUuid,
		});
	});

	it("returns existing daemon instance ID if it exists", () => {
		const existingId = "existing-instance-id";
		mockGetDaemonInstanceId.execute.mockReturnValue(existingId);

		const result = getOrSetDaemonInstanceId.execute();

		expect(result).toBe(existingId);
		expect(mockGetDaemonInstanceId.execute).toHaveBeenCalled();
		expect(mockSaveDaemonInstanceId.execute).not.toHaveBeenCalled();
	});

	it("generates and saves a new daemon instance ID if none exists", () => {
		mockGetDaemonInstanceId.execute.mockReturnValue(null);
		const newId = "new-instance-id";
		mockSaveDaemonInstanceId.execute.mockReturnValue(newId);
		mockGenerateUuid.mockReturnValue(newId);

		const result = getOrSetDaemonInstanceId.execute();

		expect(result).toBe(newId);
		expect(mockGetDaemonInstanceId.execute).toHaveBeenCalled();
		expect(mockSaveDaemonInstanceId.execute).toHaveBeenCalledWith(newId);
	});

	it("throws an error if saveDaemonInstanceId fails", () => {
		mockGetDaemonInstanceId.execute.mockReturnValue(null);
		mockSaveDaemonInstanceId.execute.mockImplementation(() => {
			throw new Error("Save failed");
		});

		expect(() => getOrSetDaemonInstanceId.execute()).toThrow("Save failed");
		expect(mockGetDaemonInstanceId.execute).toHaveBeenCalled();
		expect(mockSaveDaemonInstanceId.execute).toHaveBeenCalled();
	});
});
