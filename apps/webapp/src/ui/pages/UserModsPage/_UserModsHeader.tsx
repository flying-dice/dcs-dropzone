import { Button, Group } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { FaPlus } from "react-icons/fa";
import { USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID } from "../../../../../../playwright.constants.ts";

export function _UserModsHeader(props: { onNewMod: () => void }) {
	const { t } = useAppTranslation();

	return (
		<Group justify={"end"}>
			<Button data-testid={USER_MODS_PUBLISH_NEW_MOD_BTN_TEST_ID} leftSection={<FaPlus />} onClick={props.onNewMod}>
				{t("PUBLISH_NEW_MOD")}
			</Button>
		</Group>
	);
}
