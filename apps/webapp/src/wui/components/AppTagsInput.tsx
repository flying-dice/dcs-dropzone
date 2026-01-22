import { Badge, Group, Stack, Text, TextInput } from "@mantine/core";
import { ze } from "@packages/zod/ze";
import { err, ok, type Result } from "neverthrow";
import type * as React from "react";
import { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { z } from "zod";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";

export type AppTagsInputProps = {
	value: string[];
	onChange: (value: string[]) => void;
};
export function AppTagsInput(props: AppTagsInputProps) {
	const { t } = useAppTranslation();
	const [values, setValues] = useState<Set<string>>(new Set(props.value));

	const validateInput = (value: string): Result<string, string> => {
		const parseRes = ze.tag().safeParse(value);
		if (!parseRes.success) {
			return err(
				z
					.treeifyError(parseRes.error)
					.errors.map((error) => t(error as any))
					.join(", "),
			);
		}

		if (values.has(value)) {
			return err(t("DUPLICATE_TAG_ERROR"));
		}

		return ok(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const result = validateInput(e.currentTarget.value);
			if (result.isOk()) {
				const newValues = new Set(values);
				newValues.add(result.value);
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

					const result = validateInput(e.currentTarget.value);
					if (result.isErr()) {
						setError(result.error);
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
