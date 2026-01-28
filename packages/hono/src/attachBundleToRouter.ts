import type { HTMLBundle } from "bun";
import type { Hono } from "hono";
import { getLogger } from "log4js";

const logger = getLogger("getBundleRouter");

export type GetBundleRouterProps = {
	router: Hono<any>;
	entrypoint: HTMLBundle;
	headers?: HeadersInit;
	config?: Bun.BuildConfig;
};

export async function attachBundleToRouter(props: GetBundleRouterProps) {
	const build = await Bun.build({
		...props.config,
		entrypoints: [props.entrypoint.index],
		outdir: undefined,
		target: "browser",
	});

	if (!build.success) {
		if (Array.isArray(build.logs)) {
			for (const log of build.logs) {
				logger.info(log);
			}
		}

		throw new Error("Build failed");
	}

	for (const file of build.outputs) {
		const path = file.path.slice(2);

		logger.info("Adding route for:", path);

		const handler = () =>
			new Response(file.stream(), {
				headers: {
					"Content-Type": file.type,
					...props.headers,
				},
				status: 200,
			});

		if (path === "index.html" || path === "index.htm") {
			props.router.get("/", handler);
		}

		props.router.get(path, handler);

		logger.info("Adding route for:", path);
	}
}
