import { Modal, Text } from "@mantine/core";
import type { ModReleaseData } from "../_autogen/api.ts";
import { generateExplainPlan } from "../utils/generateExplainPlan.ts";
import { Markdown } from "./Markdown.tsx";

export type ExplainPlanModalProps = {
	opened: boolean;
	onClose: () => void;
	release: ModReleaseData;
};

/**
 * Modal component that displays the installation explain plan for a mod release.
 * Shows a human-readable description of all actions that will be performed during installation.
 */
export function ExplainPlanModal(props: ExplainPlanModalProps) {
	const planMarkdown = generateExplainPlan(props.release);

	return (
		<Modal
			opened={props.opened}
			onClose={props.onClose}
			title={
				<Text fw="bold" size="lg">
					Installation Plan Preview
				</Text>
			}
			size="xl"
			centered
		>
			<Markdown content={planMarkdown} />
		</Modal>
	);
}
