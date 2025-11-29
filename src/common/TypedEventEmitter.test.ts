import { describe, expect, it } from "bun:test";
import { TypedEventEmitter } from "./TypedEventEmitter";

type TestEvents = {
	message: [string];
	count: [number];
	multi: [string, number, boolean];
};

describe("TypedEventEmitter", () => {
	it("should emit and receive events with on()", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		const received: string[] = [];

		emitter.on("message", (msg) => {
			received.push(msg);
		});

		emitter.emit("message", "hello");
		emitter.emit("message", "world");

		expect(received).toEqual(["hello", "world"]);
	});

	it("should emit and receive events with addListener()", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		const received: number[] = [];

		emitter.addListener("count", (num) => {
			received.push(num);
		});

		emitter.emit("count", 42);
		emitter.emit("count", 100);

		expect(received).toEqual([42, 100]);
	});

	it("should only fire once with once()", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		const received: string[] = [];

		emitter.once("message", (msg) => {
			received.push(msg);
		});

		emitter.emit("message", "first");
		emitter.emit("message", "second");

		expect(received).toEqual(["first"]);
	});

	it("should remove listener with off()", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		const received: string[] = [];

		const listener = (msg: string) => {
			received.push(msg);
		};

		emitter.on("message", listener);
		emitter.emit("message", "before");

		emitter.off("message", listener);
		emitter.emit("message", "after");

		expect(received).toEqual(["before"]);
	});

	it("should remove listener with removeListener()", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		const received: number[] = [];

		const listener = (num: number) => {
			received.push(num);
		};

		emitter.on("count", listener);
		emitter.emit("count", 1);

		emitter.removeListener("count", listener);
		emitter.emit("count", 2);

		expect(received).toEqual([1]);
	});

	it("should handle events with multiple arguments", () => {
		const emitter = new TypedEventEmitter<TestEvents>();
		let result: [string, number, boolean] | null = null;

		emitter.on("multi", (str, num, bool) => {
			result = [str, num, bool];
		});

		emitter.emit("multi", "test", 42, true);

		expect(result).not.toBeNull();
		expect(result![0]).toBe("test");
		expect(result![1]).toBe(42);
		expect(result![2]).toBe(true);
	});

	it("emit() should return true when listeners exist", () => {
		const emitter = new TypedEventEmitter<TestEvents>();

		emitter.on("message", () => {});

		const result = emitter.emit("message", "test");
		expect(result).toBe(true);
	});

	it("emit() should return false when no listeners exist", () => {
		const emitter = new TypedEventEmitter<TestEvents>();

		const result = emitter.emit("message", "test");
		expect(result).toBe(false);
	});
});
