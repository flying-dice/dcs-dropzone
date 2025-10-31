import { Button, Group } from "@mantine/core";
import { BiBold, BiItalic, BiLink, BiListUl } from "react-icons/bi";

export type MarkdownToolbarProps = {
	onBoldClick: () => void;
	onItalicClick: () => void;
	onListClick: () => void;
	onLinkClick: () => void;
};
export function MarkdownToolbar(props: MarkdownToolbarProps) {
	return (
		<Group gap={"xs"}>
			<Button
				color={"gray"}
				variant={"subtle"}
				size={"compact-xs"}
				leftSection={<BiBold />}
				onClick={props.onBoldClick}
			>
				Bold
			</Button>
			<Button
				color={"gray"}
				variant={"subtle"}
				size={"compact-xs"}
				leftSection={<BiItalic />}
				onClick={props.onItalicClick}
			>
				Italic
			</Button>
			<Button
				color={"gray"}
				variant={"subtle"}
				size={"compact-xs"}
				leftSection={<BiListUl />}
				onClick={props.onListClick}
			>
				List
			</Button>
			<Button
				color={"gray"}
				variant={"subtle"}
				size={"compact-xs"}
				leftSection={<BiLink />}
				onClick={props.onLinkClick}
			>
				Link
			</Button>
		</Group>
	);
}
