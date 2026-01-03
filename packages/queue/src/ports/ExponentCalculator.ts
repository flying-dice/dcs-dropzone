/**
 * Port for calculating the next scheduled time after a failed run.
 */
export type ExponentCalculator = {
	/**
	 * Calculate the next scheduledAt time based on the current attempt count.
	 */
	calculate: (attempts: number, baseDate?: Date) => Date;
};
