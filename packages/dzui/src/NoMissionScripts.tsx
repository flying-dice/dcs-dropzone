import { FaFileCode } from "react-icons/fa";
import { EmptyState } from "./EmptyState.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";

export function NoMissionScripts() {
	const { t } = useAppTranslation();
	return (
		<EmptyState
			title={t("NO_MISSION_SCRIPTS_TITLE")}
			description={t("NO_MISSION_SCRIPTS_DESCRIPTION")}
			icon={FaFileCode}
		/>
	);
}
