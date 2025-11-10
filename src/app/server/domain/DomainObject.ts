import type { z } from "zod";

/**
 * Abstract class representing a domain object with a schema and data validation.
 *
 * @template S - A Zod schema type extending `z.ZodTypeAny`.
 */
export abstract class DomainObject<S extends z.ZodTypeAny> {
	/**
	 * The Zod schema used for validation.
	 * @protected
	 * @readonly
	 */
	protected readonly schema: S;

	/**
	 * The internal data of the domain object, validated against the schema.
	 * @private
	 */
	private _data: Readonly<z.infer<S>>;

	/**
	 * Constructs a new DomainObject instance.
	 *
	 * @param schema - The Zod schema used to validate the input data.
	 * @param input - The input data to be validated and stored.
	 * @throws {z.ZodError} If the input data does not conform to the schema.
	 */
	protected constructor(schema: S, input: z.input<S>) {
		const parsed = schema.parse(input);
		this.schema = schema;
		this._data = parsed;
	}

	/**
	 * Retrieves the internal data of the domain object.
	 *
	 * @protected
	 * @returns The validated data as a readonly object.
	 */
	protected get data(): Readonly<z.infer<S>> {
		return this._data;
	}

	/**
	 * Updates the internal data of the domain object.
	 *
	 * @protected
	 * @param input - The new input data to be validated and stored.
	 * @throws {z.ZodError} If the input data does not conform to the schema.
	 */
	protected setData(input: z.input<S>): void {
		this._data = this.schema.parse(input);
	}

	/**
	 * Converts the internal data to a plain JavaScript object.
	 *
	 * @returns A deep copy of the internal data as a plain object.
	 */
	toData(): Readonly<z.infer<S>> {
		return JSON.parse(JSON.stringify(this._data));
	}
}
