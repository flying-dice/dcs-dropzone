import { Badge, Group, Stack, Text, TextInput } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { ze } from "@packages/zod/ze";
import type * as React from "react";
import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { z } from "zod";

export type AppTagsInputProps = {
	value: string[];
	onChange: (value: string[]) => void;
};
export function AppTagsInput(props: AppTagsInputProps) {
	const { t } = useAppTranslation();
	const [values, setValues] = useState<Set<string>>(new Set(props.value));

	const validateInput = (value: string): [string, null] | [undefined, string] => {
		const parseRes = ze.tag().safeParse(value);
		if (!parseRes.success) {
			return [undefined,
				z
					.treeifyError(parseRes.error)
					.errors.map((error) => t(error as any))
					.join(", "),
			];
		}

		if (values.has(value)) {
			return [undefined, t("DUPLICATE_TAG_ERROR")];
		}

		return [value, null];
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const [value] = validateInput(e.currentTarget.value);
			if (value !== undefined) {
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
				placeholder={t("TAGS_INPUT_PLACEHOLDER")}
				onKeyDown={handleKeyDown}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					e.currentTarget.value = e.currentTarget.value.toLowerCase();

					if (e.currentTarget.value === "") {
						setError(null);
						return;
					}

					const [, validationError] = validateInput(e.currentTarget.value);
					if (validationError !== undefined) {
						setError(validationError);
					} else {
						setError(null);
					}
				}}
				error={error}
			/>
			<Text c="dimmed" size={"sm"}>
				{t("TAGS_INPUT_HELPER_TEXT")}
			</Text>
			<Group gap={"xs"}>
				{props.value?.map((tag) => (
					<Badge
						data-testid={`tag-badge-${tag}`}
						variant={"light"}
						key={tag}
						rightSection={<AiOutlineClose />}
						style={{ cursor: "pointer", textTransform: "none" }}
						onClick={handleBadgeClick(tag)}
					>
						{tag}
					</Badge>
				))}
			</Group>
		</Stack>
	);
}
