import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { ZodError } from "zod";

export function ErrorApp(props: { error: ZodError }) {
	useKeyboard(async (event) => {
		if (event.eventType === "press" && (event.name === "q" || event.name === "escape")) {
			process.exit(1);
		}
	});

	return (
		<box flexGrow={1} flexDirection="column" padding={2}>
			<box flexDirection="column" marginBottom={1}>
				<text attributes={TextAttributes.BOLD} fg="red">
					❌ Configuration Validation Failed
				</text>
			</box>

			<box flexDirection="column" marginBottom={2}>
				<text>The following configuration errors were found:</text>
			</box>

			<box flexDirection="column" marginBottom={2}>
				{props.error.issues.map((issue, index) => {
					const pathStr = issue.path.length > 0 ? issue.path.join(".") : "config";
					return (
						<box key={`error-${index}-${pathStr}`} flexDirection="row" marginBottom={1}>
							<text fg="yellow">• [{pathStr}]</text>
							<text> {issue.message}</text>
						</box>
					);
				})}
			</box>

			<box flexDirection="column" marginTop={1}>
				<text>Please update your config.toml file and restart the daemon.</text>
			</box>

			<box flexDirection="column" marginTop={2}>
				<text fg="gray">Press 'q' or 'ESC' to exit</text>
			</box>
		</box>
	);
}
