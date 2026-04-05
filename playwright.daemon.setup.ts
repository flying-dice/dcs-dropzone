import { $ } from "bun";

await $`bun src/playwright-server.ts`.cwd("./apps/daemon");
