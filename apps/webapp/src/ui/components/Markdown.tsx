import { Typography } from "@mantine/core";
import { marked } from "marked";
import { useAsync } from "react-use";

export type MarkdownProps = {
	content: string;
};
export function Markdown(props: MarkdownProps) {
	const __html = useAsync(async () => marked.parse(props.content), [props.content]);

	return (
		<Typography className="readme">
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: This is necessary to render the markdown content. The content should be sanitized before being passed to this component.
				dangerouslySetInnerHTML={{
					__html: __html.value || "",
				}}
			/>
		</Typography>
	);
}
