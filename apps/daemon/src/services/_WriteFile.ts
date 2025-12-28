import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export class _WriteFile {
	execute(filePath: string, content: string): void {
		const parent = dirname(filePath);

		if (!existsSync(parent)) {
			mkdirSync(parent, { recursive: true });
		}

		writeFileSync(filePath, content);
	}
}
