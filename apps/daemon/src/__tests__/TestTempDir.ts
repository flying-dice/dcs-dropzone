import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLogger } from "log4js";

const logger = getLogger("TestTempDir");

export class TestTempDir {
	path: string;

	constructor() {
		this.path = mkdtempSync(join(tmpdir(), "dcs-dropzone__"));
	}

	join(...paths: string[]): string {
		return join(this.path, ...paths);
	}

	glob(pattern: string): string[] {
		const glob = new Bun.Glob(join(this.path, pattern));
		return Array.from(glob.scanSync({ followSymlinks: true }));
	}

	cleanup(): void {
		logger.info("Removing temporary directory:", this.glob("**/*"));
		rmSync(this.path, { recursive: true });
	}
}
