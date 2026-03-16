import { $ } from "bun";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongoMemoryServer = await MongoMemoryServer.create();
await mongoMemoryServer.ensureInstance();

await $`bun src/index.ts`
	.env({
		DropzoneWebapp_userCookieSecret: "test-secret",
		DropzoneWebapp_mongoUri: mongoMemoryServer.getUri(),
	})
	.cwd("./apps/webapp");
