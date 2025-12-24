import { Colors } from "./theme.ts";

export function Footer() {
	return (
		<box height={1} flexDirection={"row"} backgroundColor={Colors.DARK}>
			<text fg={"white"}>↑/↓: Navigate Mods | E: Enable | D: Disable | R: Remove | C: Clear Logs</text>
		</box>
	);
}
