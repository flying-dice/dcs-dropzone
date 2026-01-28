import { beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import index from "./__tests__/index.html";
import { attachBundleToRouter } from "./attachBundleToRouter.ts";

describe("getBundle", async () => {
	let router: Hono;

	beforeAll(async () => {
		router = new Hono();
		await attachBundleToRouter({ router, entrypoint: index });
	});

	it("should fetch index", async () => {
		const url = new URL("http://localhost/");
		const res = await router.fetch(new Request(url));
		const resText = await res.text();
		expect(resText).toMatchSnapshot();
	});
});
