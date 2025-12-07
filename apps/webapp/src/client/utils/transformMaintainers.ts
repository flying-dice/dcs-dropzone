export function transformMaintainers(maintainers: Array<{ id: string; username: string }>): {
	value: string;
	label: string;
}[] {
	return maintainers.map((maintainer) => ({
		value: maintainer.id,
		label: maintainer.username,
	}));
}
