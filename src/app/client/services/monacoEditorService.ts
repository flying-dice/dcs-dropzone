import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

/**
 * Utility service for Monaco editor markdown operations
 */
export const monacoEditorService = {
	/**
	 * Wrap selected text with markdown bold syntax
	 */
	makeSelectionBold: (
		editor: editor.IStandaloneCodeEditor,
		_monaco: Monaco,
	) => {
		return () => {
			const selection = editor.getSelection();
			if (selection && !selection.isEmpty()) {
				const selectedText =
					editor.getModel()?.getValueInRange(selection) || "";
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
	},

	/**
	 * Wrap selected text with markdown italic syntax
	 */
	makeSelectionItalic: (
		editor: editor.IStandaloneCodeEditor,
		_monaco: Monaco,
	) => {
		return () => {
			const selection = editor.getSelection();
			if (selection && !selection.isEmpty()) {
				const selectedText =
					editor.getModel()?.getValueInRange(selection) || "";
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
	},

	/**
	 * Wrap selected text with markdown link syntax
	 */
	makeSelectionLink: (
		editor: editor.IStandaloneCodeEditor,
		_monaco: Monaco,
	) => {
		return () => {
			const selection = editor.getSelection();
			if (selection && !selection.isEmpty()) {
				const selectedText =
					editor.getModel()?.getValueInRange(selection) || "";
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
	},

	/**
	 * Wrap selected text with markdown image syntax
	 */
	makeSelectionImage: (
		editor: editor.IStandaloneCodeEditor,
		_monaco: Monaco,
	) => {
		return () => {
			const selection = editor.getSelection();
			if (selection && !selection.isEmpty()) {
				const selectedText =
					editor.getModel()?.getValueInRange(selection) || "";
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
	},

	/**
	 * Register keyboard shortcuts for common markdown operations
	 */
	registerMarkdownShortcuts: (
		editor: editor.IStandaloneCodeEditor,
		monaco: Monaco,
	) => {
		// Bold (Ctrl+B)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
			monacoEditorService.makeSelectionBold(editor, monaco),
		);

		// Italic (Ctrl+I)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
			monacoEditorService.makeSelectionItalic(editor, monaco),
		);

		// Link (Ctrl+K)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
			monacoEditorService.makeSelectionLink(editor, monaco),
		);

		// Make Image (Ctrl+Shift+I)
		editor.addCommand(
			monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
			monacoEditorService.makeSelectionImage(editor, monaco),
		);
	},
};
