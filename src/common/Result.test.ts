// result.test.ts
// These tests are both verification and living documentation for the Result API.

import { describe, expect, it } from "bun:test";
import { z } from "zod";
import {
	err,
	fromPromise,
	fromThrowable,
	isErr,
	isOk,
	match,
	ok,
	type Result,
} from "./Result";

describe("Result core primitives", () => {
	describe("ok()", () => {
		it("wraps a successful value with a null error", () => {
			const result = ok<number, string>(42);

			const [value, error] = result;

			expect(value).toBe(42);
			expect(error).toBeNull();
		});

		it("works with complex types", () => {
			type User = { id: string; email: string };

			const user: User = {
				id: "123",
				email: "user@example.com",
			};

			const result = ok<User, Error>(user);
			const [value, error] = result;

			expect(value).toEqual(user);
			expect(error).toBeNull();
		});
	});

	describe("err()", () => {
		it("wraps an error with a null value", () => {
			const error = new Error("Something went wrong");
			const result = err<number, Error>(error);

			const [value, errValue] = result;

			expect(value).toBeNull();
			expect(errValue).toBe(error);
		});

		it("can use discriminated union errors for better handling", () => {
			type NotFoundError = { kind: "not_found"; id: string };
			type ValidationError = { kind: "validation"; field: string };

			const error: ValidationError = { kind: "validation", field: "email" };
			const result = err<string, NotFoundError | ValidationError>(error);

			const [value, errValue] = result;

			expect(value).toBeNull();
			expect(errValue).toEqual({ kind: "validation", field: "email" });
		});
	});

	describe("isOk() and isErr()", () => {
		it("correctly identifies ok results", () => {
			const result = ok<number, string>(123);

			expect(isOk(result)).toBe(true);
			expect(isErr(result)).toBe(false);

			if (isOk(result)) {
				const [value, error] = result;
				// At this point, TypeScript knows:
				// value: number
				// error: null
				expect(value).toBe(123);
				expect(error).toBeNull();
			}
		});

		it("correctly identifies err results", () => {
			const result = err<number, string>("oops");

			expect(isOk(result)).toBe(false);
			expect(isErr(result)).toBe(true);

			if (isErr(result)) {
				const [value, error] = result;
				// At this point, TypeScript knows:
				// value: null
				// error: string
				expect(value).toBeNull();
				expect(error).toBe("oops");
			}
		});

		it("allows safe branching on discriminated unions", () => {
			type ParseError = { kind: "parse"; error: unknown };
			type ValidationError = { kind: "validation"; field: string };

			const parseError: ParseError = { kind: "parse", error: "invalid json" };
			const result: Result<number, ParseError | ValidationError> =
				err(parseError);

			if (isErr(result)) {
				const [, error] = result;

				// TypeScript allows safe narrowing by `kind`
				if (error.kind === "parse") {
					expect(error.error).toBe("invalid json");
				} else {
					// This branch would only run for ValidationError
					expect(error.field).toBeDefined();
				}
			}
		});
	});

	describe("match()", () => {
		it("invokes the ok handler for successful results", () => {
			const result = ok<number, string>(10);

			const message = match(result, {
				ok: (value) => `Value is ${value}`,
				err: (error) => `Error: ${error}`,
			});

			expect(message).toBe("Value is 10");
		});

		it("invokes the err handler for error results", () => {
			const result = err<number, string>("failure");

			const message = match(result, {
				ok: (value) => `Value is ${value}`,
				err: (error) => `Error: ${error}`,
			});

			expect(message).toBe("Error: failure");
		});

		it("can be used to transform results into other types", () => {
			const okResult = ok<number, string>(5);
			const errResult = err<number, string>("boom");

			const normalizedOk = match(okResult, {
				ok: (value) => ({ success: true, value }),
				err: (error) => ({ success: false, error }),
			});

			const normalizedErr = match(errResult, {
				ok: (value) => ({ success: true, value }),
				err: (error) => ({ success: false, error }),
			});

			expect(normalizedOk).toEqual({ success: true, value: 5 });
			expect(normalizedErr).toEqual({ success: false, error: "boom" });
		});
	});
});

describe("fromThrowable()", () => {
	it("captures a successful function call as ok", () => {
		const fn = () => "hello";

		const result = fromThrowable(fn);

		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			const [value, error] = result;
			expect(value).toBe("hello");
			expect(error).toBeNull();
		}
	});

	it("captures thrown errors as err", () => {
		const error = new Error("Boom");
		const fn = () => {
			throw error;
		};

		const result = fromThrowable(fn);

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			const [value, errValue] = result;
			expect(value).toBeNull();
			expect(errValue).toBe(error);
		}
	});

	it("applies an optional errorMapper to transform the error type", () => {
		type MyError = { message: string; code: number };

		const fn = () => {
			throw new Error("Database unreachable");
		};

		const result = fromThrowable<string, MyError>(fn, (e) => ({
			message: (e as Error).message,
			code: 503,
		}));

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			const [, errValue] = result;
			expect(errValue).toEqual({
				message: "Database unreachable",
				code: 503,
			});
		}
	});
});

describe("fromPromise()", () => {
	it("wraps a resolved promise as ok", async () => {
		const p = Promise.resolve(123);

		const result = await fromPromise<number, Error>(p);

		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			const [value, error] = result;
			expect(value).toBe(123);
			expect(error).toBeNull();
		}
	});

	it("wraps a rejected promise as err", async () => {
		const error = new Error("Network error");
		const p = Promise.reject(error);

		const result = await fromPromise<number, Error>(p);

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			const [value, errValue] = result;
			expect(value).toBeNull();
			expect(errValue).toBe(error);
		}
	});

	it("works nicely with async/await flows", async () => {
		async function fetchUser(): Promise<{ id: string; name: string }> {
			return { id: "u1", name: "Alice" };
		}

		const result = await fromPromise(fetchUser());

		match(result, {
			ok: (user) => {
				expect(user).toEqual({ id: "u1", name: "Alice" });
			},
			err: () => {
				// This path should not be hit in this test
				expect(true).toBe(false);
			},
		});
	});
});

describe("Documenting example: JSON parsing + validation", () => {
	// Discriminated error types for better handling
	type ParseError = {
		kind: "parse";
		error: unknown;
	};

	type ValidationError = {
		kind: "validation";
		error: z.ZodError;
	};

	// Simple JSON parse with a typed parse error
	function parseJson(input: string): Result<unknown, ParseError> {
		return fromThrowable(
			() => JSON.parse(input),
			(error): ParseError => ({ kind: "parse", error }),
		);
	}

	// JSON parse + Zod validation:
	// error is either a parse error or a validation error
	function parseJsonWithSchema<T>(
		input: string,
		schema: z.ZodSchema<T>,
	): Result<T, ParseError | ValidationError> {
		const [value, parseErr] = parseJson(input);

		if (parseErr) {
			// Still a parse error
			return err(parseErr);
		}

		const validation = schema.safeParse(value);

		if (!validation.success) {
			return err({
				kind: "validation",
				error: validation.error,
			});
		}

		return ok(validation.data);
	}

	const User = z.object({
		id: z.string().uuid(),
		email: z.string().email(),
	});

	it("returns ok for valid JSON that matches the schema", () => {
		const json = JSON.stringify({
			id: "550e8400-e29b-41d4-a716-446655440000",
			email: "user@example.com",
		});

		const result = parseJsonWithSchema(json, User);

		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			const [user, error] = result;
			expect(error).toBeNull();
			expect(user).toEqual({
				id: "550e8400-e29b-41d4-a716-446655440000",
				email: "user@example.com",
			});
		}
	});

	it("returns a parse error for invalid JSON", () => {
		const invalidJson = '{"id": 123, '; // malformed JSON

		const result = parseJsonWithSchema(invalidJson, User);

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			const [, error] = result;

			expect(error.kind).toBe("parse");
			expect(error.error).toBeInstanceOf(SyntaxError);
		}
	});

	it("returns a validation error for valid JSON that fails schema validation", () => {
		const json = JSON.stringify({
			id: "not-a-uuid",
			email: "not-an-email",
		});

		const result = parseJsonWithSchema(json, User);

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			const [, error] = result;

			expect(error.kind).toBe("validation");
			expect(error.error).toBeInstanceOf(z.ZodError);
			expect(
				error.kind === "validation" && error.error.issues.length,
			).toBeGreaterThan(0);
		}
	});

	it("demonstrates handling with isErr / isOk", () => {
		const json = JSON.stringify({
			id: "not-a-uuid",
			email: "not-an-email",
		});

		const result = parseJsonWithSchema(json, User);

		if (isErr(result)) {
			const [, error] = result;

			if (error.kind === "parse") {
				// Here you might log or handle parse errors
				expect(error.error).toBeInstanceOf(SyntaxError);
			} else {
				// Validation errors expose Zod issues
				expect(error.error.issues).toBeDefined();
			}
		} else {
			// This branch would only happen for success
			const [user] = result;
			expect(user.id).toBeDefined();
		}
	});

	it("demonstrates handling with match()", () => {
		const json = JSON.stringify({
			id: "not-a-uuid",
			email: "not-an-email",
		});

		const result = parseJsonWithSchema(json, User);

		const message = match(result, {
			ok: (user) => `Valid user: ${user.email}`,
			err: (error) => {
				switch (error.kind) {
					case "parse":
						return "Invalid JSON";
					case "validation":
						return `Validation failed (${error.error.issues.length} issues)`;
				}
			},
		});

		expect(typeof message).toBe("string");
		expect(message).toContain("Validation failed");
	});
});
