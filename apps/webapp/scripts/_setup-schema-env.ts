import { resolve } from "node:path";
import { envLocalDev } from "./_env.ts";

const envParsed = Object.fromEntries(Object.entries(envLocalDev).map(([k, v]) => [k, String(v)]));
Object.assign(process.env, envParsed);
process.env.DZ_WEBAPP_MONGO_URI ??= "mongodb://127.0.0.1:27017/schema-gen";

process.chdir(resolve(import.meta.dirname, "../"));
