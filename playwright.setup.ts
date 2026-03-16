import { $ } from "bun";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongoMemoryServer = await MongoMemoryServer.create();
await mongoMemoryServer.ensureInstance();

await $`bun run dev`
	.env({
		DropzoneWebapp_mongoUri: mongoMemoryServer.getUri(),
	})
	.cwd("./apps/webapp");
