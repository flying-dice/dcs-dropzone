import { z } from "zod";

export enum TargetEnvironment {
	Local = "local",
	Prod = "prod",
}

export function targetEnvironment(): TargetEnvironment {
	return z.enum(TargetEnvironment).default(TargetEnvironment.Local).parse(process.env.DZ_TARGET_ENV);
}

export function getForCurrentTargetEnv<T>(options: Record<TargetEnvironment, T>): T {
	return options[targetEnvironment()];
}
