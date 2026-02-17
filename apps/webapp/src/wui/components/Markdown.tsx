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
				dangerouslySetInnerHTML={{
					__html: __html.value || "",
				}}
			/>
		</Typography>
	);
}
