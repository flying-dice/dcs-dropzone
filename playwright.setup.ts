import { $ } from "bun";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongoMemoryServer = await MongoMemoryServer.create();
await mongoMemoryServer.ensureInstance();

await $`bun --env-file=.env.local src/index.ts --DZ_WEBAPP_MONGO_URI='${mongoMemoryServer.getUri()}'`.cwd(
	"./apps/webapp",
);
