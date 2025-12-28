import { existsSync } from "node:fs";
import { rmSync } from "fs-extra";

export class _RemoveDir {
	execute(path: string): void {
		if (existsSync(path)) {
			rmSync(path, { force: true, recursive: true });
		}
	}
}
