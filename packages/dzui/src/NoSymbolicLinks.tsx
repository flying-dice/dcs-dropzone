import { FaLink } from "react-icons/fa";
import { EmptyState } from "./EmptyState.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";

export function NoSymbolicLinks() {
	const { t } = useAppTranslation();
	return (
		<EmptyState title={t("NO_SYMBOLIC_LINKS_TITLE")} description={t("NO_SYMBOLIC_LINKS_DESCRIPTION")} icon={FaLink} />
	);
}
