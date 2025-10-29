import type {Logger} from "pino";
import type {MiddlewareHandler} from "hono";

export const loggerMiddleware = (logger: Logger): MiddlewareHandler => async (c, next) => {
    const start = performance.now();
    await next()
    const duration = (performance.now() - start).toFixed(4)

    const requestId = c.get('requestId')
    const method = c.req.method
    const path = c.req.path
    const status = c.res.status
    const params = c.req.param()
    const query = c.req.query()

    logger.debug({ requestId, method, path, status, duration, params, query }, `Request ${method} ${path} completed with status ${status} in ${duration}ms`)
};