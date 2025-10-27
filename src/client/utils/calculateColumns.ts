/**
 * Given a screen width and target width, calculate the number of columns (span)
 * that an element should occupy in a 12-column grid layout.
 *
 * @param screenWidth - The total width of the screen or container.
 * @param targetWidth - The desired width of the element.
 */
export function calculateColumns(
	screenWidth: number,
	targetWidth: number,
): number {
	if (screenWidth < 0) throw new Error("screenWidth must be non-negative");
	if (targetWidth < 0) throw new Error("targetWidth must be non-negative");

	const targetWidthClamped = Math.min(targetWidth, screenWidth);

	return Math.floor(screenWidth / targetWidthClamped);
}
