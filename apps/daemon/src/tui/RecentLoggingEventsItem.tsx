import { RGBA, SyntaxStyle, TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { format } from "date-fns";
import objectHash from "object-hash";
import type { RecentLoggingEvent } from "../log4js.ts";

export type RecentLoggingEventsItemProps = {
	event: RecentLoggingEvent;
};
export function RecentLoggingEventsItem({ event }: RecentLoggingEventsItemProps) {
	const { width: terminalWidth } = useTerminalDimensions();
	const color = event.level.levelStr === "ERROR" ? "red" : event.level.levelStr === "WARN" ? "yellow" : undefined;

	const DATE = `[${format(event.startTime, "yyyy-MM-dd HH:mm:ss")}]`;
	const DATE_W = 21;
	const LEVEL = `[${event.level.levelStr.padEnd(5, " ")}]`;
	const LEVEL_W = 7;
	const SEP = `-`;
	const SEP_W = 1;
	const [MSG, ...DATA] = event.data;

	const syntaxStyle = SyntaxStyle.fromStyles({
		keyword: { fg: RGBA.fromHex("#ff6b6b"), bold: true }, // red, bold
		string: { fg: RGBA.fromHex("#51cf66") }, // green
		comment: { fg: RGBA.fromHex("#868e96"), italic: true }, // gray, italic
		number: { fg: RGBA.fromHex("#ffd43b") }, // yellow
		default: { fg: RGBA.fromHex("#ffffff") }, // white
	});

	return (
		<box paddingBottom={1}>
			<box flexDirection={"row"} gap={1}>
				<box width={DATE_W}>
					<text fg={color}>{DATE}</text>
				</box>
				<box width={LEVEL_W}>
					<text fg={color}>{LEVEL}</text>
				</box>
				<box width={SEP_W}>
					<text fg={color}>{SEP}</text>
				</box>
				<text fg={color} width={terminalWidth - DATE_W - LEVEL_W - SEP_W - 6}>
					{MSG}
				</text>
			</box>
			{DATA.length > 0 &&
				DATA.map((data) => (
					<box key={objectHash(data)}>
						<code
							attributes={TextAttributes.DIM}
							content={Bun.YAML.stringify(data, undefined, 2)}
							filetype="yaml"
							syntaxStyle={syntaxStyle}
						/>
					</box>
				))}
		</box>
	);
}
