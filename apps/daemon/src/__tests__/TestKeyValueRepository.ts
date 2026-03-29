import type { KeyValueRepository } from "../application/ports/KeyValueRepository.ts";

export class TestKeyValueRepository implements KeyValueRepository {
	private store = new Map<string, string>();

	get(key: string): string | undefined {
		return this.store.get(key);
	}

	save(key: string, value: string): string {
		this.store.set(key, value);
		return value;
	}

	delete(key: string): void {
		this.store.delete(key);
	}
}
