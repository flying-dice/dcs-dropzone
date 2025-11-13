import { Button, Card, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal } from "@mantine/modals";
import { useNavigate } from "react-router-dom";
import {
	deleteUserMod,
	type ModData,
	useGetUserMods,
} from "../../_autogen/api.ts";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";
import type { UserModForm } from "./form.ts";

export function _FormActions(props: { form: UserModForm; mod: ModData }) {
	const nav = useNavigate();
	const userMods = useGetUserMods();

	const handleDiscard = () => {
		openConfirmModal({
			title: "Discard Changes",
			children: (
				<Text>
					Are you sure you want to discard all changes? This action cannot be
					undone.
				</Text>
			),
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
			children: (
				<Text>
					Are you sure you want to delete this mod? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: modals.closeAll,
			onConfirm: async () => {
				await deleteUserMod(props.mod.id);
				await userMods.refetch();
				showSuccessNotification(
					"Mod deleted successfully!",
					"Your mod has been deleted.",
				);
				nav("/user-mods");
			},
		});
	};

	return (
		<Card withBorder>
			<Stack>
				<Button type="submit">Save Changes</Button>
				<Button variant={"default"} onClick={handleDiscard}>
					Discard Changes
				</Button>
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					Delete Mod
				</Button>
			</Stack>
		</Card>
	);
}
