import { ActionIcon, type ActionIconProps } from "@mantine/core";
import { openModal } from "@mantine/modals";
import type { ReactNode } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { Markdown } from "./Markdown.tsx";

function openMarkdownModal(markdown: string, title?: ReactNode) {
	openModal({
		size: "xl",
		title,
		children: <Markdown content={markdown} />,
	});
}

export type HelpProps = {
	title?: ReactNode;
	markdown: string;
	variant?: ActionIconProps["variant"];
	c?: ActionIconProps["c"];
	color?: ActionIconProps["color"];
};

export function Help(props: HelpProps) {
	return (
		<ActionIcon variant={props.variant || "subtle"} onClick={() => openMarkdownModal(props.markdown, props.title)}>
			<FaCircleInfo />
		</ActionIcon>
	);
}
