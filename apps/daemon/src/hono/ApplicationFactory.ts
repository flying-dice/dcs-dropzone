import { createApplicationFactory } from "@packages/hono/createApplicationFactory";
import type { Application } from "../application/Application.ts";

/**
 * Typed Hono factory for the daemon's {@link Application}.
 *
 * Route files under `../routes/` import this to build handler arrays
 * via `ApplicationFactory.createHandlers(...)`. Handlers reach the
 * Application through `c.var.app` — routes must not import the
 * Application directly.
 */
export const ApplicationFactory = createApplicationFactory<Application>();

export default ApplicationFactory;
