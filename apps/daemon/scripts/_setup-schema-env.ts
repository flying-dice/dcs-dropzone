import { resolve } from "node:path";
import { envLocalDev } from "./_env.ts";

const envParsed = Object.fromEntries(Object.entries(envLocalDev).map(([k, v]) => [k, String(v)]));
Object.assign(process.env, envParsed);
process.env.DZ_DAEMON_DATABASE_PATH = ":memory:";

process.chdir(resolve(import.meta.dirname, "../"));
