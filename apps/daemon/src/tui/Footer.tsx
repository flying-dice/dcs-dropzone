import { Colors } from "./theme.ts";

export function Footer(props: { instructions: string[] }) {
	return (
		<box height={1} flexDirection={"row"} backgroundColor={Colors.DARK}>
			<text fg={"white"}>{props.instructions.join(" | ")}</text>
		</box>
	);
}
