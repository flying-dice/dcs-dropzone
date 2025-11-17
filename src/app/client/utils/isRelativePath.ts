export function isRelativePath(path: string): boolean {
	const normalizedPath = path.replace(/\\/g, "/");
	return !normalizedPath.startsWith("/");
}
