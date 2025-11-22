/**
 * Represents a successful result with a value and no error.
 * @template T - The type of the success value.
 */
export type Ok<T> = [value: T, error: null];

/**
 * Represents an error result with no value and an error.
 * @template E - The type of the error value.
 */
export type Err<E> = [value: null, error: E];

/**
 * Instead of throwing, a function can return `Result<T, E>`.
 * Callers must explicitly handle both success and error cases.
 *
 * ```ts
 * import { z } from "zod";
 * import {
 *   type Result,
 *   ok,
 *   err,
 *   isOk,
 *   isErr,
 *   match,
 * } from "./result";
 *
 * // Discriminated error types for better handling
 * type ParseError = {
 *   kind: "parse";
 *   error: unknown;
 * };
 *
 * type ValidationError = {
 *   kind: "validation";
 *   error: z.ZodError;
 * };
 *
 * // Simple JSON parse with a typed parse error
 * function parseJson(input: string): Result<unknown, ParseError> {
 *   try {
 *     return ok(JSON.parse(input));
 *   } catch (error) {
 *     return err({ kind: "parse", error });
 *   }
 * }
 *
 * // JSON parse + Zod validation:
 * // error is either a parse error or a validation error
 * function parseJsonWithSchema<T>(
 *   input: string,
 *   schema: z.ZodSchema<T>,
 * ): Result<T, ParseError | ValidationError> {
 *   const [value, parseErr] = parseJson(input);
 *
 *   if (parseErr) {
 *     // Still a parse error
 *     return err(parseErr);
 *   }
 *
 *   const validation = schema.safeParse(value);
 *
 *   if (!validation.success) {
 *     return err({
 *       kind: "validation",
 *       error: validation.error,
 *     });
 *   }
 *
 *   return ok(validation.data);
 * }
 *
 * // Example schema
 * const User = z.object({
 *   id: z.string().uuid(),
 *   email: z.string().email(),
 * });
 *
 * const result = parseJsonWithSchema('{"id":"...","email":"user@example.com"}', User);
 *
 * // Option 1: using type guards
 * if (isErr(result)) {
 *   const [, error] = result;
 *
 *   if (error.kind === "parse") {
 *     console.error("Invalid JSON:", error.error);
 *   } else {
 *     console.error("Validation failed:", error.error.issues);
 *   }
 * } else {
 *   const [user] = result;
 *   console.log("Valid user:", user);
 * }
 *
 * // Option 2: using `match`
 * match(result, {
 *   ok: (user) => {
 *     console.log("Valid user (via match):", user);
 *   },
 *   err: (error) => {
 *     switch (error.kind) {
 *       case "parse":
 *         console.error("Invalid JSON (via match):", error.error);
 *         break;
 *       case "validation":
 *         console.error("Validation failed (via match):", error.error.issues);
 *         break;
 *     }
 *   },
 * });
 * ```
 *
 * ## When to use
 *
 * - For operations that can fail in a *normal* way (parsing, validation,
 *   IO-like operations, external API calls, database queries).
 * - When you want to avoid untyped `throw` / `catch` and make failures part of
 *   your function’s signature.
 * - At module boundaries or public APIs where you want consumers to
 *   be forced to handle errors explicitly.
 *
 * ## How this helps with "checked exceptions" in TypeScript
 *
 * TypeScript does not have real checked exceptions, so a function that throws
 * can technically throw anything, and the type system doesn’t require callers
 * to catch or handle those errors.
 *
 * By returning `Result<T, E>` instead:
 *
 * - The error type `E` is explicit and statically known (e.g. `Result<User, ValidationError>`).
 * - Callers cannot ignore the possibility of failure without opting out of
 *   type safety (e.g. via `!` or unsafe casts).
 * - In code reviews and refactors, the function’s type clearly documents which
 *   operations can fail and how, without hunting for hidden `throw` statements.
 *
 * This pattern effectively simulates checked exceptions by encoding success
 * and failure as data, not control flow.
 *
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates a Result representing a successful value.
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 * @param {T} value - The success value.
 * @returns {Result<T, E>} A Result containing the success value.
 */
export function ok<T, E>(value: T): Result<T, E> {
	return [value, null];
}

/**
 * Creates a Result representing an error value.
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 * @param {E} error - The error value.
 * @returns {Result<T, E>} A Result containing the error value.
 */
export function err<T, E>(error: E): Result<T, E> {
	return [null, error];
}

/**
 * Checks if a Result is a success (Ok).
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 * @param {Result<T, E>} result - The Result to check.
 * @returns {result is [T, null]} True if the Result is a success, false otherwise.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result[1] === null;
}

/**
 * Checks if a Result is an error (Err).
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 * @param {Result<T, E>} result - The Result to check.
 * @returns {result is [null, E]} True if the Result is an error, false otherwise.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result[0] === null;
}

/**
 * Matches a Result to a corresponding handler function for Ok or Err.
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 * @template TR - The return type of the Ok handler.
 * @template ER - The return type of the Err handler.
 * @param {Result<T, E>} result - The Result to match.
 * @param {Object} matcher - An object containing the Ok and Err handler functions.
 * @param {(value: T) => TR} matcher.ok - The handler for the Ok case.
 * @param {(error: E) => ER} matcher.err - The handler for the Err case.
 * @returns {TR | ER} The result of the matched handler function.
 */
export function match<T, E, TR, ER>(
	result: Result<T, E>,
	matcher: {
		ok: (value: T) => TR;
		err: (error: E) => ER;
	},
): TR | ER {
	if (isOk(result)) {
		return matcher.ok(result[0] as T);
	} else {
		return matcher.err(result[1] as E);
	}
}

/**
 * Wraps a synchronous function that might throw and captures its thrown value as an Err.
 * @template T - The type of the success value.
 * @template E - The type of the error value (defaults to unknown).
 * @param {() => T} fn - The function to execute.
 * @param errorMapper {(e: unknown) => E} [errorMapper] - Optional function to map the thrown error to type E.
 * @returns {Result<T, E>} A Result containing the function's return value or the thrown error.
 */
export function fromThrowable<T, E = unknown>(
	fn: () => T,
	errorMapper?: (e: unknown) => E,
): Result<T, E> {
	try {
		return ok<T, E>(fn());
	} catch (e) {
		if (errorMapper) {
			return err<T, E>(errorMapper(e));
		}

		return err<T, E>(e as E);
	}
}

/**
 * Converts a Promise into a Promise of a Result, catching any rejection or thrown error.
 * @template T - The type of the success value.
 * @template E - The type of the error value (defaults to unknown).
 * @param {Promise<T>} p - The Promise to convert.
 * @returns {Promise<Result<T, E>>} A Promise containing a Result.
 */
export async function fromPromise<T, E = unknown>(
	p: Promise<T>,
): Promise<Result<T, E>> {
	try {
		const value = await p;
		return ok<T, E>(value);
	} catch (e) {
		return err<T, E>(e as E);
	}
}
