import { Badge, Group, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

export type AppTagsInputProps = {
	value: string[];
	onChange: (value: string[]) => void;
};
export function AppTagsInput(props: AppTagsInputProps) {
	const [values, setValues] = useState<Set<string>>(new Set(props.value));

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const value = e.currentTarget.value.trim().toUpperCase();
			if (value && !props.value.includes(value)) {
				const newValues = new Set(values);
				newValues.add(value);
				setValues(newValues);
				props.onChange(Array.from(newValues));
				e.currentTarget.value = "";
			}
		}
	};

	const handleBadgeClick = (tag: string) => () => {
		const newValues = new Set(values);
		newValues.delete(tag);
		setValues(newValues);
		props.onChange(Array.from(newValues));
	};

	const [error, setError] = useState<string | null>(null);

	return (
		<Stack gap={"xs"}>
			<TextInput
				placeholder={"Add Tags (press Enter to add)"}
				onKeyDown={handleKeyDown}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					e.currentTarget.value = e.currentTarget.value.toUpperCase();
					if (values.has(e.currentTarget.value)) {
						setError("Duplicate tags are not allowed");
					} else {
						setError(null);
					}
				}}
				error={error}
			/>
			<Text c="dimmed" size={"sm"}>
				Use relevant tags to help users find your mod
			</Text>
			<Group gap={"xs"}>
				{props.value?.map((tag) => (
					<Badge
						variant={"light"}
						key={tag}
						rightSection={<AiOutlineClose />}
						style={{ cursor: "pointer" }}
						onClick={handleBadgeClick(tag)}
					>
						{tag}
					</Badge>
				))}
			</Group>
		</Stack>
	);
}
