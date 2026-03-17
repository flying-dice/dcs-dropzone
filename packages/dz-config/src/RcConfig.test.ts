import { afterEach, describe, expect, it } from "bun:test";
import { z } from "zod";
import { RcConfig } from "./RcConfig.ts";

const schema = z.object({
	host: z.string(),
	port: z.coerce.number(),
});

const defaults = { host: "0.0.0.0", port: 8080 };

describe("RcConfig", () => {
	afterEach(() => {
		delete process.env.testapp_host;
		delete process.env.testapp_port;
	});

	it("should use defaults when no env vars are set", () => {
		const config = new RcConfig("testapp", schema, defaults);

		expect(config.config).toMatchObject({ host: "0.0.0.0", port: 8080 });
	});

	it("should override defaults with env vars", () => {
		process.env.testapp_host = "localhost";
		process.env.testapp_port = "3000";

		const config = new RcConfig("testapp", schema, defaults);

		expect(config.config).toMatchObject({ host: "localhost", port: 3000 });
	});

	it("should expose the appName", () => {
		const config = new RcConfig("testapp", schema, defaults);

		expect(config.appName).toBe("testapp");
	});

	it("should expose the configSchema", () => {
		const config = new RcConfig("testapp", schema, defaults);

		expect(config.configSchema).toBe(schema);
	});

	it("should expose the defaults", () => {
		const config = new RcConfig("testapp", schema, defaults);

		expect(config.defaults).toBe(defaults);
	});

	it("should throw when config does not match the schema", () => {
		process.env.testapp_host = "";
		delete process.env.testapp_port;

		const schemaStrict = z.object({
			host: z.string().min(1),
			port: z.number(),
		});

		expect(() => new RcConfig("testapp", schemaStrict, { host: "", port: NaN })).toThrow();
	});
});
