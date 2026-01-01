import type { AttributesRepository } from "../application/ports/AttributesRepository.ts";

export class TestAttributesRepository implements AttributesRepository {
	private attributes = new Map<string, string>();

	get(key: string): string | undefined {
		return this.attributes.get(key);
	}

	save(key: string, value: string): string {
		this.attributes.set(key, value);
		return value;
	}
}
