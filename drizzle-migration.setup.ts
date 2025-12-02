import { writeFile } from "node:fs/promises";
import { basename, join, posix, relative, resolve, win32 } from "node:path";
import { Glob } from "bun";
import { toSnakeCase } from "drizzle-orm/casing";

const glob = new Glob("./src/daemon/database/ddl/**/*.sql");

const files: string[] = [];

const outFolder = resolve("./src/daemon/database");

const outFile = join(outFolder, "db-ddl.ts");

for await (const path of glob.scan({ absolute: true, onlyFiles: true })) {
	const relativePath = relative(outFolder, path).replaceAll(win32.sep, posix.sep);

	files.push(relativePath);
}

const imports: string[] = [];
const exports: string[] = [];

for (const file of files) {
	const varName = `_${toSnakeCase(basename(file))}`;
	imports.push(`// @ts-expect-error\nimport ${varName} from "./${file}" with { type: "text" };`);
	exports.push(varName);
}

await writeFile(
	outFile,
	`\
${imports.join("\n")}

export const ddlExports: Record<string, string> = { ${exports.join(", ")} };
`,
);
