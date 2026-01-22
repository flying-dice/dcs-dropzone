import { ZodObject, ZodOptional, type ZodTypeAny } from "zod";

export function getShapeFromZodObject<T extends ZodTypeAny>(schema: T, path: PropertyKey[]): ZodTypeAny {
	let current: ZodTypeAny = schema as ZodTypeAny;

	for (const segment of path) {
		while (current instanceof ZodOptional) {
			current = current.unwrap() as ZodTypeAny;
		}

		if (current instanceof ZodObject) {
			const next = (current.shape as Record<PropertyKey, ZodTypeAny | undefined>)[segment];
			if (next === undefined) {
				throw new Error(`Path '${String(segment)}' does not exist in the schema.`);
			}
			current = next;

			continue;
		}

		throw new Error(`Path '${String(segment)}' is not an object, cannot traverse further.`);
	}
	return current as ZodTypeAny;
}
