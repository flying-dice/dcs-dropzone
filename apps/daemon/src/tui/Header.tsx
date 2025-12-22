import { TextAttributes } from "@opentui/core";
import { Colors } from "./theme.ts";

export function Header() {
	return (
		<box height={1} flexDirection={"row"} justifyContent={"space-between"}>
			<text attributes={TextAttributes.BOLD} fg={Colors.PRIMARY}>
				Dropzone Daemon
			</text>
			<text attributes={TextAttributes.DIM}>
				↑/↓: Navigate Mods | E: Enable | D: Disable | R: Remove | C: Clear Logs
			</text>
		</box>
	);
}
