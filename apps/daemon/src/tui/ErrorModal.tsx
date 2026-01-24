import type { LineNumberRenderable } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { useMemo, useRef } from "react";
import { Footer } from "./Footer.tsx";
import { Colors, syntaxStyle } from "./theme.ts";

export type ErrorModalProps = {
	error: Error;
	onClose: () => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function ErrorModal(props: ErrorModalProps) {
	const { height, width } = useTerminalDimensions();

	const xGutter = 6;
	const yGutter = 3;

	const maxModalWidth = Math.max(10, width - xGutter * 2);
	const maxModalHeight = Math.max(6, height - yGutter * 2);

	// XL-ish: big, centered, not full screen
	const modalWidth = clamp(Math.floor(width * 0.7), 60, maxModalWidth);
	const modalHeight = clamp(Math.floor(height * 0.75), 14, maxModalHeight);

	const left = Math.floor((width - modalWidth) / 2);
	const top = Math.floor((height - modalHeight) / 2);

	const content = useMemo(() => JSON.stringify(props.error, null, 2), [props.error]);

	const innerWidth = Math.max(1, modalWidth - 2);
	const innerHeight = Math.max(1, modalHeight - 2);
	const lineNumberRef = useRef<LineNumberRenderable>(null);

	return (
		<box backgroundColor={Colors.OVERLAY} height={"100%"} width={"100%"} position={"absolute"}>
			<box
				borderColor={Colors.DANGER}
				title={props.error.name}
				border={["left", "right", "top", "bottom"]}
				position={"absolute"}
				left={left}
				top={top}
				width={modalWidth}
				height={modalHeight}
				backgroundColor={Colors.DARK}
			>
				<scrollbox overflow={"scroll"} scrollY scrollX width={innerWidth} height={innerHeight - 1}>
					<text margin={1}>{props.error.message}</text>
					<box title={"Error Detail"} border={["top"]}>
						<box border={["top", "bottom", "left", "right"]} borderStyle={"rounded"} borderColor={Colors.BORDER}>
							<line-number ref={lineNumberRef} minWidth={3} showLineNumbers={true}>
								<code content={content} filetype="javascript" syntaxStyle={syntaxStyle} />
							</line-number>
						</box>
					</box>
				</scrollbox>
			</box>
			<box position={"absolute"} bottom={0} width={"100%"}>
				<Footer instructions={["Esc: Dismiss"]} />
			</box>
		</box>
	);
}
