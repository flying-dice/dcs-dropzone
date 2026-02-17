import type { DelayCalculator } from "./DelayCalculator.ts";

export class ExponentialDelayCalculator implements DelayCalculator {
	private readonly baseDelay: number;
	private readonly maxDelay: number;

	constructor(baseDelay: number, maxDelay: number) {
		this.baseDelay = baseDelay;
		this.maxDelay = maxDelay;
	}

	calculateDelayMs(attempt: number): number {
		const delay = this.baseDelay * 2 ** (attempt - 1);
		return Math.min(delay, this.maxDelay);
	}
}
