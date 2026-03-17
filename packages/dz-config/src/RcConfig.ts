import rc from "rc";
import type { ZodType } from "zod";

export class RcConfig<CONFIG extends Record<string, any>> {
	public readonly config: CONFIG;

	constructor(
		public readonly appName: string,
		public readonly configSchema: ZodType<CONFIG>,
		public readonly defaults: Partial<CONFIG>,
	) {
		this.config = configSchema.parse(rc(appName, defaults));
	}
}
