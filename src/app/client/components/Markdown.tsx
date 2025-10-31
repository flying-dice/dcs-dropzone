import { Typography } from "@mantine/core";
import { marked } from "marked";

export type MarkdownProps = {
	content: string;
};
export function Markdown(props: MarkdownProps) {
	return (
		<Typography className="readme">
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: This is needed to render markdown content
				dangerouslySetInnerHTML={{
					__html: marked.parse(props.content),
				}}
			/>
		</Typography>
	);
}
