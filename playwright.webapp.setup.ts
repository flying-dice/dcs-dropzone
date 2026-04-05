import { $ } from "bun";
import { MongoMemoryServer } from "mongodb-memory-server";
import { z } from "zod";
import { envLocalTest } from "./apps/webapp/scripts/_env.ts";

const mongoMemoryServer = await MongoMemoryServer.create();
await mongoMemoryServer.ensureInstance();

await $`bun src/index.ts'`
	.env({
		...z.record(z.string(), z.coerce.string()).parse(envLocalTest),
		...process.env,
		DZ_WEBAPP_MONGO_URI: mongoMemoryServer.getUri(),
	})
	.cwd("./apps/webapp");
