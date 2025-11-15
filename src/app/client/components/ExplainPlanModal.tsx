import { Button, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { marked } from "marked";
import type { ModReleaseData } from "../_autogen/api.ts";
import { generateExplainPlan } from "../utils/generateExplainPlan.ts";

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
	const planHtml = marked.parse(planMarkdown, { async: false }) as string;

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
			<Stack>
				<ScrollArea.Autosize mah={600}>
					<div
						// biome-ignore lint/security/noDangerouslySetInnerHtml: This is needed to render markdown content for the explain plan
						dangerouslySetInnerHTML={{ __html: planHtml }}
						style={{
							padding: "1rem",
							lineHeight: "1.6",
						}}
					/>
				</ScrollArea.Autosize>
				<Button onClick={props.onClose} fullWidth>
					Close
				</Button>
			</Stack>
		</Modal>
	);
}
