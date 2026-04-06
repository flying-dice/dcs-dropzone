import { $ } from "bun";
import { resolve } from "node:path";
import { envLocalTest } from "daemon/scripts/_env.ts";
import { z } from "zod";

await $`bun src/index.ts`
	.env({
		...z.record(z.string(), z.coerce.string()).parse(envLocalTest),
		...process.env,
		LOG4JS_CONFIG: resolve("./apps/daemon/log4js.playwright.yaml"),
	})
	.cwd("./apps/daemon");
