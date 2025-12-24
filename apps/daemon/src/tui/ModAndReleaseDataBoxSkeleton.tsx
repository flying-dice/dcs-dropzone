import { TextAttributes } from "@opentui/core";

export function ModAndReleaseDataBoxSkeleton() {
	return (
		<box flexDirection={"column"} border={["left"]} flexGrow={1} borderColor={"gray"}>
			<box padding={1} flexGrow={1}>
				<text fg={"gray"} attributes={TextAttributes.ITALIC}>
					Selected mod details will appear here.
				</text>
			</box>
		</box>
	);
}
