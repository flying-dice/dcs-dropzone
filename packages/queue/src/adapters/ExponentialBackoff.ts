import type { ExponentCalculator } from "../ports/ExponentCalculator.ts";

export type ExponentialBackoffOptions = {
	/**
	 * Base delay in milliseconds.
	 * @default 1000
	 */
	baseDelayMs?: number;
	/**
	 * Maximum delay in milliseconds.
	 * @default 3600000 (1 hour)
	 */
	maxDelayMs?: number;
	/**
	 * Multiplier for exponential growth.
	 * @default 2
	 */
	multiplier?: number;
};

/**
 * Exponential backoff calculator for job retries.
 *
 * Calculates delay as: baseDelayMs * (multiplier ^ (attempts - 1))
 * Capped at maxDelayMs.
 */
export class ExponentialBackoff implements ExponentCalculator {
	private readonly baseDelayMs: number;
	private readonly maxDelayMs: number;
	private readonly multiplier: number;

	constructor(options: ExponentialBackoffOptions = {}) {
		this.baseDelayMs = options.baseDelayMs ?? 1000;
		this.maxDelayMs = options.maxDelayMs ?? 3600000;
		this.multiplier = options.multiplier ?? 2;
	}

	calculate(attempts: number, baseDate?: Date): Date {
		const base = baseDate ?? new Date();
		const delay = Math.min(this.baseDelayMs * this.multiplier ** (attempts - 1), this.maxDelayMs);
		return new Date(base.getTime() + delay);
	}
}
