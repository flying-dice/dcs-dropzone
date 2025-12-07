export function fromCsv(csv?: string): string[] | undefined {
	return csv?.split(",").map((item) => item.trim());
}
