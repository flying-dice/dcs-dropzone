/**
 * Calculates the average percentage progress from an array of progress values.
 *
 * @param progresses - An array of numbers representing individual progress percentages (0 to 100) or null values.
 * @returns The average progress percentage as a number between 0 and 100. Returns 0 if there are no valid progress values.
 */
export function totalPercentProgress(
	progresses: Array<number | null | undefined>,
): number {
	const validProgresses = progresses.filter(
		(p): p is number => p !== undefined && p !== null && !Number.isNaN(p),
	);
	if (validProgresses.length === 0) {
		return 0;
	}
	const total = validProgresses.reduce((acc, curr) => acc + curr, 0);
	return total / validProgresses.length;
}
