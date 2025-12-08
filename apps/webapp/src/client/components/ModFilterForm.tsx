import { Button, Group, MultiSelect, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaMagnifyingGlass, FaShapes, FaTag, FaUser } from "react-icons/fa6";
import { z } from "zod";
import { ModDataCategory } from "../_autogen/api.ts";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { ModCategorySelect } from "./ModCategorySelect.tsx";

const categorySchema = z.codec(
	z
		.enum(ModDataCategory)
		.nullable()
		.optional(), // Input Schema: Nullable String
	z
		.enum(ModDataCategory)
		.optional(), // Output Schema: Optional String
	{
		decode: (i) => i ?? undefined, // Input → Optional String
		encode: (i) => i, // Optional String → String
	},
);

const formValues = z.object({
	category: categorySchema,
	authors: z.string().array().optional(),
	tags: z.string().array().optional(),
	term: z.string().optional(),
});

export type ModFilterFormValues = z.output<typeof formValues>;

export type ModFilterFormProps = {
	initialValues: ModFilterFormValues;
	onSubmit: (values: ModFilterFormValues) => void;
	categories: ModDataCategory[];
	users: { id: string; username: string }[];
	tags: string[];
	loading?: boolean;
};

export function ModFilterForm(props: ModFilterFormProps) {
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();
	const form = useForm<ModFilterFormValues>({
		initialValues: formValues.parse(props.initialValues),
		validate: zod4Resolver(formValues),
	});

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack>
				<TextInput
					label={t("SEARCH_TERM")}
					placeholder={t("SEARCH_PLACEHOLDER")}
					{...form.getInputProps("term")}
					leftSection={<FaMagnifyingGlass />}
					disabled={props.loading}
				/>
				<SimpleGrid cols={breakpoint.isXs ? 1 : 3}>
					<ModCategorySelect
						label={t("CATEGORY")}
						data={props.categories}
						placeholder={form.values.category ? undefined : t("ALL")}
						clearable
						searchable
						{...form.getInputProps("category")}
						leftSection={<FaShapes />}
						disabled={props.loading}
					/>
					<MultiSelect
						label={t("AUTHOR")}
						placeholder={form.values.authors?.length ? undefined : t("ALL")}
						clearable
						data={props.users.map((user) => ({ value: user.id, label: user.username }))}
						searchable
						{...form.getInputProps("authors")}
						leftSection={<FaUser />}
						disabled={props.loading}
					/>
					<MultiSelect
						label={t("TAGS")}
						placeholder={form.values.tags?.length ? undefined : t("ALL")}
						clearable
						data={props.tags}
						searchable
						{...form.getInputProps("tags")}
						leftSection={<FaTag />}
						disabled={props.loading}
					/>
				</SimpleGrid>
				<Group justify={"flex-end"}>
					<Button type={"submit"} disabled={props.loading}>
						{t("APPLY")}
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
