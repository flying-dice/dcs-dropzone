export function transformTags(tags: string[]): {
	value: string;
	label: string;
}[] {
	return tags.map((tag) => ({
		value: tag,
		label: tag,
	}));
}
