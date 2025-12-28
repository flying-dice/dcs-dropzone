import { existsSync, mkdirSync } from "node:fs";

export class _EnsureDir {
	execute(path: string): void {
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
	}
}
