export interface DelayCalculator {
	calculateDelayMs(attempts: number): number;
}
