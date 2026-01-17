import { Container, getContainer, getRandom } from "@cloudflare/containers";
import { type Context, Hono } from "hono";

export class DcsDropzoneContainer extends Container<Env> {
	defaultPort = 3000;
	// Time before container sleeps due to inactivity (default: 30s)
	sleepAfter = "2m";
	// Environment variables passed to the container
	envVars = {
		MESSAGE: "I was passed in via the container class!",
	};

	// Optional lifecycle hooks
	override onStart() {
		console.log("Container successfully started");
	}

	override onStop() {
		console.log("Container successfully shut down");
	}

	override onError(error: unknown) {
		console.log("Container error:", error);
	}
}

// Create Hono app with proper typing for Cloudflare Workers
const app = new Hono<{ Bindings: Env }>();

function isLoadBalanceFeatureEnabled(c: Context): boolean {
	const lbHeader = c.req.header("X-Load-Balance")?.toLowerCase();
	return lbHeader === "enabled" || lbHeader === "true" || lbHeader === "1" || lbHeader === "y" || lbHeader === "yes";
}

function getSpecificContainer(c: Context) {
	return c.req.header("X-ContainerId");
}

// Get all requests as using a singleton container
app.all("*", async (c) => {
	let container: ReturnType<typeof getContainer>;

	const specificContainerId = getSpecificContainer(c);
	if (specificContainerId) {
		// Use specific container if header is set
		const containerId = c.env.DCS_DROPZONE_CONTAINER.idFromName(specificContainerId);
		container = c.env.DCS_DROPZONE_CONTAINER.get(containerId);
	} else if (isLoadBalanceFeatureEnabled(c)) {
		// Use random container for load balancing
		container = await getRandom(c.env.DCS_DROPZONE_CONTAINER, 3);
	} else {
		// Use singleton container
		container = getContainer(c.env.DCS_DROPZONE_CONTAINER);
	}

	return await container.fetch(c.req.raw);
});

export default app;
