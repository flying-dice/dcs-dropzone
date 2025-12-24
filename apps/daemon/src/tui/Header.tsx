import { TextAttributes } from "@opentui/core";
import { Colors } from "./theme.ts";

export function Header() {
	return (
		<box title={"Dropzone"} height={1} flexDirection={"row"} backgroundColor={Colors.PRIMARY}>
			<text attributes={TextAttributes.BOLD} fg={Colors.DARK}>
				Dropzone Daemon
			</text>
		</box>
	);
}
