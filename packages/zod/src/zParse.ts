import { err, ok, type Result } from "neverthrow";
import type { ZodError, ZodType, z } from "zod";

/**
 * Parses a value using a Zod schema while enforcing strict TypeScript type safety.
 *
 * Unlike standard `schema.parse()` (which accepts `unknown` inputs and only catches
 * errors at runtime), this wrapper forces the input `value` to match the schema's
 * expected **input** type at compile time, catching structural mismatches early in your IDE.
 *
 * For schemas with `.transform()`, the input type may differ from the output type.
 * This function correctly constrains the value against the input type while returning
 * the transformed output type.
 *
 * @template S - The Zod schema type, inferred from the `schema` parameter.
 * @param {z.input<S>} value - The data to validate. Must structurally match the schema's input type at compile time.
 * @param {S} schema - The Zod schema to validate the value against at runtime.
 * @returns {z.output<S>} The successfully parsed and validated value (post-transform if applicable).
 * @throws {ZodError} If the `value` fails runtime validation against the `schema`.
 *
 * @example
 * const UserSchema = z.object({ name: z.string() });
 *
 * // ❌ Fails at compile-time (Type mismatch)
 * zParse({ name: 123 }, UserSchema);
 *
 * // ✅ Passes compile-time and runtime validation
 * const validUser = zParse({ name: "Alice" }, UserSchema);
 *
 * // ✅ Works correctly with .transform() schemas
 * const ErrorData = z.object({ code: z.number(), message: z.string().optional() })
 *   .transform(it => ({ ...it, message: it.message || "default" }));
 * // Input allows optional message, output has required message
 * zParse({ code: 404 }, ErrorData); // ✅ compiles — message is optional in input
 */
export function zParse<S extends ZodType>(value: z.input<S>, schema: S): z.output<S> {
	return schema.parse(value);
}

/**
 * Validates a value using a Zod schema and returns a `neverthrow` Result,
 * enforcing strict TypeScript type safety at compile time.
 *
 * This wrapper guarantees that the input `value` matches the schema's expected
 * input type during development. At runtime, it returns a `Result<Output, ZodError>`,
 * forcing the consumer to handle both the success (`ok`) and failure (`err`) paths
 * explicitly, eliminating unhandled runtime exceptions.
 *
 * @template S - The Zod schema type, inferred from the `schema` parameter.
 * @param {z.input<S>} value - The data to validate. Must structurally match the schema's input type at compile time.
 * @param {S} schema - The Zod schema to validate the value against at runtime.
 * @returns {Result<z.output<S>, ZodError>} A `neverthrow` Result containing either the parsed data or a ZodError.
 *
 * @example
 * const UserSchema = z.object({ email: z.string().email() });
 *
 * // ❌ Fails at compile-time (Type mismatch)
 * zParseWithResult({ email: 123 }, UserSchema);
 *
 * // ✅ Passes compile-time, returns a Result for runtime handling
 * const result = zParseWithResult({ email: "test@example.com" }, UserSchema);
 *
 * // `neverthrow` forces you to handle both cases neatly:
 * result.match(
 *   (validUser) => console.log("Success:", validUser.email),
 *   (error) => console.error("Validation failed:", error.issues)
 * );
 */
export function zParseWithResult<S extends ZodType>(value: z.input<S>, schema: S): Result<z.output<S>, ZodError> {
	const result = schema.safeParse(value);

	if (result.success) {
		return ok(result.data);
	}

	return err(result.error);
}

/**
 * Validates a value using a Zod schema without throwing errors, while enforcing
 * strict TypeScript type safety at compile time.
 *
 * Unlike standard `schema.safeParse()` (which accepts `unknown` inputs), this wrapper
 * forces the input `value` to structurally match the schema's expected input type during
 * development. It returns a result object indicating success or failure, making it ideal
 * for control flow where runtime validation failures are expected and handled.
 *
 * @template S - The Zod schema type, inferred from the `schema` parameter.
 * @param {z.input<S>} value - The data to validate. Must structurally match the schema's input type at compile time.
 * @param {S} schema - The Zod schema to validate the value against at runtime.
 * @returns An object containing either `{ success: true, data: Output }` or `{ success: false, error: ZodError }`.
 *
 * @example
 * const UserSchema = z.object({ name: z.string(), age: z.number() });
 *
 * // ❌ Fails at compile-time (Type mismatch: 'age' is a string)
 * zSafeParse({ name: "Alice", age: "25" }, UserSchema);
 *
 * // ✅ Passes compile-time, handles runtime safely
 * const result = zSafeParse({ name: "Alice", age: 25 }, UserSchema);
 *
 * if (result.success) {
 *   console.log("Valid user:", result.data.name);
 * } else {
 *   console.error("Validation failed:", result.error.format());
 * }
 */
export function zSafeParse<S extends ZodType>(value: z.input<S>, schema: S) {
	return schema.safeParse(value);
}
