import type { ModDataCategory } from "../_autogen/api.ts";
import type { I18nKeys } from "../i18n/I18nKeys.ts";

export type SelectOption = {
	value: string;
	label: string;
};

/**
 * Service module for transforming mod filter data into UI-ready formats
 */
export const modFilterService = {
	/**
	 * Transform category strings into select options with translations
	 */
	transformCategories: (
		categories: string[],
		t: (key: I18nKeys) => string,
	): Array<{ value: ModDataCategory; label: string }> => {
		return categories.map((category) => ({
			value: category as ModDataCategory,
			label: t(category as I18nKeys),
		}));
	},

	/**
	 * Transform maintainer objects into select options
	 */
	transformMaintainers: (maintainers: Array<{ id: string; username: string }>): SelectOption[] => {
		return maintainers.map((maintainer) => ({
			value: maintainer.id,
			label: maintainer.username,
		}));
	},

	/**
	 * Transform tag strings into select options
	 */
	transformTags: (tags: string[]): SelectOption[] => {
		return tags.map((tag) => ({
			value: tag,
			label: tag,
		}));
	},

	/**
	 * Calculate display range text for pagination
	 */
	calculateDisplayRange: (
		page: {
			number: number;
			size: number;
			totalElements: number;
		},
		itemsInCurrentPage: number,
	): { start: number; end: number; total: number } => {
		const start = (page.number - 1) * page.size + 1;
		const end = (page.number - 1) * page.size + itemsInCurrentPage;

		return {
			start,
			end,
			total: page.totalElements,
		};
	},
};
