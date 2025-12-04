import { Button, Group } from "@mantine/core";
import { FaPlus } from "react-icons/fa";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

export function _UserModsHeader(props: { onNewMod: () => void }) {
	const { t } = useAppTranslation();

	return (
		<Group justify={"end"}>
			<Button leftSection={<FaPlus />} onClick={props.onNewMod}>
				{t("PUBLISH_NEW_MOD")}
			</Button>
		</Group>
	);
}
