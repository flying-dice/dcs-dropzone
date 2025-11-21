import { useSearchParams } from "react-router-dom";
import type { ModDataCategory } from "../_autogen/api.ts";

export type ModFilters = {
	category?: ModDataCategory;
	maintainers?: string;
	tags?: string;
	term?: string;
};

export type ModFilterValues = {
	category?: ModDataCategory;
	authors?: string[];
	tags?: string[];
	term?: string;
};

/**
 * Custom hook to manage mod filter state via URL search parameters
 */
export function useModFilters() {
	const [searchParams, setSearchParams] = useSearchParams();

	const filters: ModFilters = {
		category: (searchParams.get("category") as ModDataCategory) || undefined,
		maintainers: searchParams.get("authors") || undefined,
		tags: searchParams.get("tags") || undefined,
		term: searchParams.get("term") || undefined,
	};

	const initialValues: ModFilterValues = {
		category: filters.category || undefined,
		authors: filters.maintainers?.split(",") || undefined,
		tags: filters.tags?.split(",") || undefined,
		term: filters.term || undefined,
	};

	const updateFilters = (values: ModFilterValues) => {
		if (values.category && values.category.length > 0) {
			searchParams.set("category", values.category);
		} else {
			searchParams.delete("category");
		}

		if (values.tags && values.tags.length > 0) {
			searchParams.set("tags", values.tags.join(","));
		} else {
			searchParams.delete("tags");
		}

		if (values.authors && values.authors.length > 0) {
			searchParams.set("authors", values.authors.join(","));
		} else {
			searchParams.delete("authors");
		}

		if (values.term && values.term.length > 0) {
			searchParams.set("term", encodeURIComponent(values.term));
		} else {
			searchParams.delete("term");
		}

		setSearchParams(searchParams);
	};

	return {
		filters,
		initialValues,
		updateFilters,
	};
}
