import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { getShapeFromZodObject } from "./getShapeFromZodObject.ts";

describe("getShapeFromZodObject", () => {
	it("should get basic 1 deep shape", () => {
		const schema = z.object({
			foo: z.string(),
			bar: z.number(),
		});

		expect(getShapeFromZodObject(schema, ["foo"])).toBe(schema.shape.foo);
	});

	it("should get nested shape", () => {
		const schema = z.object({
			foo: z.object({
				bar: z.string(),
				baz: z.number(),
			}),
			qux: z.boolean(),
		});
		expect(getShapeFromZodObject(schema, ["foo", "bar"])).toBe(schema.shape.foo.shape.bar);
	});

	it("should get nested with optional", () => {
		const schema = z.object({
			foo: z.object({
				bar: z.string().optional(),
				baz: z.number(),
			}),
			qux: z.boolean(),
		});
		expect(getShapeFromZodObject(schema, ["foo", "bar"])).toBe(schema.shape.foo.shape.bar);
	});

	it("should get nested with parent optional", () => {
		const schema = z.object({
			foo: z
				.object({
					bar: z.string(),
					baz: z.number(),
				})
				.optional(),
			qux: z.boolean(),
		});
		expect(getShapeFromZodObject(schema, ["foo", "bar"])).toBe(schema.shape.foo.def.innerType.shape.bar);
	});

	it("should get deeply nested shape", () => {
		const schema = z.object({
			level1: z.object({
				level2: z.object({
					level3: z.string(),
				}),
			}),
		});
		expect(getShapeFromZodObject(schema, ["level1", "level2", "level3"])).toBe(
			schema.shape.level1.shape.level2.shape.level3,
		);
	});

	it("should get deeply nested optional shape", () => {
		const schema = z.object({
			level1: z
				.object({
					level2: z
						.object({
							level3: z.string().optional(),
						})
						.optional(),
				})
				.optional(),
		});
		expect(getShapeFromZodObject(schema, ["level1", "level2", "level3"])).toBe(
			schema.shape.level1.def.innerType.shape.level2.def.innerType.shape.level3,
		);
	});

	it("should throw error if path is invalid", () => {
		const schema = z.object({
			foo: z.string(),
		});

		expect(() => getShapeFromZodObject(schema, ["bar"])).toThrowError("Path 'bar' does not exist in the schema.");
	});
});
