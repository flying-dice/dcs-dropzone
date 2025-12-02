export function orDefaultValue<T, R>(
	value: T | undefined | null,
	defaultValue: R,
): T | R {
	return value !== undefined && value !== null ? value : defaultValue;
}
