import { Button, Card, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal } from "@mantine/modals";
import { deleteUserMod, type ModData, useGetUserMods } from "@packages/clients/webapp";
import { showSuccessNotification, useAppTranslation } from "@packages/dzui";
import { useNavigate } from "react-router-dom";
import { MOD_SAVE_CHANGES_TEST_ID, MOD_BACK_TO_MODS_TEST_ID } from "../../../../../../playwright.constants.ts";
import type { UserModForm } from "./form.ts";

export function _FormActions(props: { form: UserModForm; mod: ModData }) {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const userMods = useGetUserMods();

	const handleDiscard = () => {
		openConfirmModal({
			title: "Discard Changes",
			children: <Text>{t("DISCARD_CHANGES_CONFIRMATION")}</Text>,
			labels: { confirm: "Discard", cancel: "Cancel" },
			onCancel: modals.closeAll,
			onConfirm: () => {
				nav("/user-mods");
			},
		});
	};

	const handleDelete = async () => {
		openConfirmModal({
			title: "Confirm Deletion",
			children: <Text>{t("DELETE_MOD_CONFIRMATION")}</Text>,
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: modals.closeAll,
			onConfirm: async () => {
				await deleteUserMod(props.mod.id);
				await userMods.refetch();
				showSuccessNotification(t("DELETE_MOD_SUCCESS_TITLE"), t("DELETE_MOD_SUCCESS_DESC"));
				nav("/user-mods");
			},
		});
	};

	return (
		<Card withBorder>
			<Stack>
				<Button data-testid={MOD_SAVE_CHANGES_TEST_ID} type="submit">
					{t("SAVE_CHANGES")}
				</Button>
				{props.form.isTouched() ? (
					<Button variant={"default"} onClick={handleDiscard}>
						{t("DISCARD_CHANGES")}
					</Button>
				) : (
					<Button data-testid={MOD_BACK_TO_MODS_TEST_ID} variant={"default"} onClick={() => nav("/user-mods")}>
						{t("BACK_TO_MODS_PAGE")}
					</Button>
				)}
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					{t("DELETE_MOD")}
				</Button>
			</Stack>
		</Card>
	);
}
