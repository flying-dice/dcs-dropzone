export interface AttributesRepository {
	get(key: string): string | undefined;
	save(key: string, value: string): string;
}
