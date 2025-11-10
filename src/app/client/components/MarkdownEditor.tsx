import {
	Button,
	Group,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { Editor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useState } from "react";
import type { IconType } from "react-icons";
import { BiBold, BiImageAlt, BiItalic, BiLink } from "react-icons/bi";

function makeSelectionBold(editor: editor.IStandaloneCodeEditor, _: Monaco) {
	return () => {
		const selection = editor.getSelection();
		if (selection && !selection.isEmpty()) {
			const selectedText = editor.getModel()?.getValueInRange(selection) || "";
			const newText = `**${selectedText}**`;
			editor.executeEdits("", [
				{
					range: selection,
					text: newText,
					forceMoveMarkers: true,
				},
			]);
		}
	};
}

function makeSelectionItalic(editor: editor.IStandaloneCodeEditor, _: Monaco) {
	return () => {
		const selection = editor.getSelection();
		if (selection && !selection.isEmpty()) {
			const selectedText = editor.getModel()?.getValueInRange(selection) || "";
			const newText = `*${selectedText}*`;
			editor.executeEdits("", [
				{
					range: selection,
					text: newText,
					forceMoveMarkers: true,
				},
			]);
		}
	};
}

function makeSelectionLink(editor: editor.IStandaloneCodeEditor, _: Monaco) {
	return () => {
		const selection = editor.getSelection();
		if (selection && !selection.isEmpty()) {
			const selectedText = editor.getModel()?.getValueInRange(selection) || "";
			const newText = `[${selectedText}](url)`;
			editor.executeEdits("", [
				{
					range: selection,
					text: newText,
					forceMoveMarkers: true,
				},
			]);
		}
	};
}

function makeSelectionImage(editor: editor.IStandaloneCodeEditor, _: Monaco) {
	return () => {
		const selection = editor.getSelection();
		if (selection && !selection.isEmpty()) {
			const selectedText = editor.getModel()?.getValueInRange(selection) || "";
			const newText = `![${selectedText}](image_url)`;
			editor.executeEdits("", [
				{
					range: selection,
					text: newText,
					forceMoveMarkers: true,
				},
			]);
		}
	};
}

type EditorButtonProps = {
	icon: IconType;
	label: string;
	onClick: () => void;
};
function EditorButton(props: EditorButtonProps) {
	return (
		<Button
			fw={"normal"}
			variant={"subtle"}
			leftSection={<props.icon />}
			size={"compact-sm"}
			onClick={props.onClick}
		>
			{props.label}
		</Button>
	);
}

export type MarkdownEditorProps = {
	value: string;
	onChange: (value: string) => void;
};
export function MarkdownEditor(props: MarkdownEditorProps) {
	const colorScheme = useComputedColorScheme();
	const [editorInstance, setEditorInstance] =
		useState<editor.IStandaloneCodeEditor | null>(null);

	const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);

	function handleEditorDidMount(
		editor: editor.IStandaloneCodeEditor,
		monaco: Monaco,
	) {
		// Bold (Ctrl+B)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
			makeSelectionBold(editor, monaco),
		);

		// Italic (Ctrl+I)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
			makeSelectionItalic(editor, monaco),
		);

		// Link (Ctrl+K)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
			makeSelectionLink(editor, monaco),
		);

		// Make Image (Ctrl+Shift+I)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
			makeSelectionImage(editor, monaco),
		);

		setEditorInstance(editor);
		setMonacoInstance(monaco);
	}

	function handleEditorWillMount(_: Monaco) {}

	return (
		<Stack pt={"md"} gap={"xs"}>
			<Editor
				theme={`vs-${colorScheme === "light" ? "light" : "dark"}`}
				value={props.value}
				onChange={(v) => props.onChange(v || "")}
				height={250}
				language="markdown"
				options={{
					fontFamily: "Inter, sans-serif",
					fontSize: 16,
					minimap: { enabled: false },
					lineNumbers: "off",
				}}
				beforeMount={handleEditorWillMount}
				onMount={handleEditorDidMount}
			/>
			<Group justify={"space-between"}>
				<Group gap={0}>
					<EditorButton
						label={"Bold"}
						icon={BiBold}
						onClick={() => {
							if (editorInstance && monacoInstance) {
								makeSelectionBold(editorInstance, monacoInstance)();
							}
						}}
					/>
					<EditorButton
						label={"Italic"}
						icon={BiItalic}
						onClick={() => {
							if (editorInstance && monacoInstance) {
								makeSelectionItalic(editorInstance, monacoInstance)();
							}
						}}
					/>
					<EditorButton
						label={"Link"}
						icon={BiLink}
						onClick={() => {
							if (editorInstance && monacoInstance) {
								makeSelectionLink(editorInstance, monacoInstance)();
							}
						}}
					/>
					<EditorButton
						label={"Image"}
						icon={BiImageAlt}
						onClick={() => {
							if (editorInstance && monacoInstance) {
								makeSelectionImage(editorInstance, monacoInstance)();
							}
						}}
					/>
				</Group>
				<Text size={"sm"} c={"dimmed"}>
					Markdown supported
				</Text>
			</Group>
		</Stack>
	);
}
