import { clamp } from "lodash";

export function getNext<T>(items: T[], current: T | undefined): T | undefined {
	if (items.length === 0) return undefined;
	if (!current) return items[0];
	const currentIndex = items.indexOf(current);
	const nextIndex = clamp(currentIndex + 1, 0, items.length - 1);
	return items[nextIndex];
}

export function getPrevious<T>(items: T[], current: T | undefined): T | undefined {
	if (items.length === 0) return undefined;
	if (!current) return items[items.length - 1];
	const currentIndex = items.indexOf(current);
	const previousIndex = clamp(currentIndex - 1, 0, items.length - 1);
	return items[previousIndex];
}

export function toPercentOrDash(value: number | undefined): string {
	if (value === undefined) return "-";
	return `${value.toFixed(0)}%`;
}
