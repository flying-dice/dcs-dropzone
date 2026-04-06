import { $ } from "bun";
import { envLocalTest } from "daemon/scripts/_env.ts";
import { z } from "zod";

await $`bun src/index.ts`
	.env({
		...z.record(z.string(), z.coerce.string()).parse(envLocalTest),
		...process.env,
	})
	.cwd("./apps/daemon");
