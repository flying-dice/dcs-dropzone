import { getLogger, type Logger } from "log4js";

function isThenable<T = unknown>(v: any): v is PromiseLike<T> {
	return v != null && (typeof v === "object" || typeof v === "function") && typeof v.then === "function";
}

/**
 * Tracing decorator to log method execution details.
 */
export const Log =
	(logger?: Pick<Logger, "trace" | "error">) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		const _logger = logger || getLogger(target.constructor.name);

		descriptor.value = function (...args: any[]) {
			const startTime = Date.now();
			_logger.trace(`Method ${propertyKey} called`, args);

			try {
				const result = originalMethod.apply(this, args);

				if (isThenable(result)) {
					return result.then(
						(value) => {
							const endTime = Date.now();
							_logger.trace(`Method ${propertyKey} executed successfully in ${endTime - startTime}ms`);
							return value;
						},
						(error) => {
							const endTime = Date.now();
							_logger.error(`Method ${propertyKey} failed after ${endTime - startTime}ms with error`, error);
							throw error;
						},
					);
				}

				const endTime = Date.now();
				_logger.trace(`Method ${propertyKey} executed successfully in ${endTime - startTime}ms`);
				return result;
			} catch (error) {
				const endTime = Date.now();
				_logger.error(`Method ${propertyKey} failed after ${endTime - startTime}ms with error`, error);
				throw error;
			}
		};

		return descriptor;
	};
