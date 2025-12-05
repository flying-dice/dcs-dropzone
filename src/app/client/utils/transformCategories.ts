import type { ModDataCategory } from "../_autogen/api.ts";
import type { I18nKeys } from "../i18n/I18nKeys.ts";

export function transformCategories(
	categories: string[],
	t: (key: I18nKeys) => string,
): { value: ModDataCategory; label: string }[] {
	return categories.map((category) => ({
		value: category as ModDataCategory,
		label: t(category as I18nKeys),
	}));
}
