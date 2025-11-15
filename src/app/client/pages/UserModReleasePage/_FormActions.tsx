import { Button, Card, Divider, Stack, Text } from "@mantine/core";
import { modals, openConfirmModal, openModal } from "@mantine/modals";
import { useNavigate } from "react-router-dom";
import {
	deleteUserModRelease,
	type ModData,
	type ModReleaseData,
	useGetUserModReleases,
} from "../../_autogen/api.ts";
import { Markdown } from "../../components/Markdown.tsx";
import { generateExplainPlan } from "../../utils/generateExplainPlan.ts";
import { showSuccessNotification } from "../../utils/showSuccessNotification.tsx";
import type { UserModReleaseForm } from "./form.ts";

export function _FormActions(props: {
	form: UserModReleaseForm;
	mod: ModData;
	release: ModReleaseData;
}) {
	const nav = useNavigate();
	const releases = useGetUserModReleases(props.mod.id);

	const handlePreviewInstallPlan = () => {
		const planMarkdown = generateExplainPlan(props.release);
		openModal({
			title: (
				<Text fw="bold" size="lg">
					Installation Plan Preview
				</Text>
			),
			size: "xl",
			centered: true,
			children: <Markdown content={planMarkdown} />,
		});
	};

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
				nav(`/user-mods/${props.mod.id}`);
			},
		});
	};

	const handleDelete = async () => {
		openConfirmModal({
			title: "Confirm Deletion",
			children: (
				<Text>
					Are you sure you want to delete this release? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: modals.closeAll,
			onConfirm: async () => {
				await deleteUserModRelease(props.mod.id, props.release.id);
				await releases.refetch();
				showSuccessNotification(
					"Release deleted successfully!",
					"Your release has been deleted.",
				);
				nav(`/user-mods/${props.mod.id}`);
			},
		});
	};

	return (
		<Card withBorder>
			<Stack>
				<Button type="submit">Save Changes</Button>
				<Button variant={"light"} onClick={handlePreviewInstallPlan}>
					Preview Install Plan
				</Button>
				<Divider />
				<Button variant={"default"} onClick={handleDiscard}>
					Discard Changes
				</Button>
				<Button color={"red"} variant={"outline"} onClick={handleDelete}>
					Delete Release
				</Button>
			</Stack>
		</Card>
	);
}
