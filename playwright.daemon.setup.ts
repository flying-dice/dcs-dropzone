import { $ } from "bun";

await $`bun playwright-server.ts`.cwd("./apps/daemon");
