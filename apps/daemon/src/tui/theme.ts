import { RGBA, SyntaxStyle } from "@opentui/core";

export const Colors = {
	PRIMARY: RGBA.fromHex("#f59e0f"),
	DANGER: RGBA.fromHex("#ef4444"),
	DARK: RGBA.fromHex("#242424"),
	LIGHT: RGBA.fromHex("#f3f4f6"),
	OVERLAY: RGBA.fromHex("#00000099"),
	BORDER: RGBA.fromHex("#515151"),
};

export const syntaxStyle = SyntaxStyle.fromStyles({
	keyword: { fg: RGBA.fromHex("#ff6b6b"), bold: true }, // red, bold
	string: { fg: RGBA.fromHex("#51cf66") }, // green
	comment: { fg: RGBA.fromHex("#868e96"), italic: true }, // gray, italic
	number: { fg: RGBA.fromHex("#ffd43b") }, // yellow
	default: { fg: RGBA.fromHex("#ffffff") }, // white
});
