import {
	Alert,
	Badge,
	Button,
	Card,
	Group,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals, openModal } from "@mantine/modals";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaLink } from "react-icons/fa";
import { z } from "zod";
import { ModReleaseSymbolicLinkDataDestRoot } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { Help } from "../../components/Help.tsx";
import {
	type TranslateFunction,
	useAppTranslation,
} from "../../i18n/useAppTranslation.ts";
import { SymbolicLinkDestRoot, type UserModReleaseForm } from "./form.ts";

const symbolicLinkFormSchema = z.object({
	src: z.string().min(1, "Source path is required"),
	dest: z.string().min(1, "Destination path is required"),
	destRoot: z.enum(ModReleaseSymbolicLinkDataDestRoot),
});
type SymbolicLinkFormValues = z.infer<typeof symbolicLinkFormSchema>;

function _SymbolicLinkForm(props: {
	defaultValues?: SymbolicLinkFormValues;
	onSubmit: (values: SymbolicLinkFormValues) => void;
	onRemove?: () => void;
}) {
	const { t } = useAppTranslation();
	const form = useForm<SymbolicLinkFormValues>({
		initialValues: props.defaultValues || {
			src: "",
			dest: "",
			destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
		},
		validate: zod4Resolver(symbolicLinkFormSchema),
	});

	const destRootOptions = [
		{
			value: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			label: t("SYMBOLIC_LINK_DEST_ROOT_WORKING_DIR"),
		},
		{
			value: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
			label: t("SYMBOLIC_LINK_DEST_ROOT_INSTALL_DIR"),
		},
	];

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<TextInput
					label={t("SYMBOLIC_LINK_SRC_LABEL")}
					description={t("SYMBOLIC_LINK_SRC_DESCRIPTION")}
					placeholder={t("SYMBOLIC_LINK_SRC_PLACEHOLDER")}
					name={"src"}
					{...form.getInputProps("src")}
				/>

				<Select
					label={t("SYMBOLIC_LINK_DEST_ROOT_LABEL")}
					description={t("SYMBOLIC_LINK_DEST_ROOT_DESCRIPTION")}
					data={destRootOptions}
					{...form.getInputProps("destRoot")}
				/>

				<TextInput
					label={t("SYMBOLIC_LINK_DEST_LABEL")}
					description={t("SYMBOLIC_LINK_DEST_DESCRIPTION")}
					placeholder={t("SYMBOLIC_LINK_DEST_PLACEHOLDER")}
					name={"dest"}
					{...form.getInputProps("dest")}
				/>

				<Group justify={"space-between"}>
					{(props.onRemove && (
						<Button color="red" variant="light" onClick={props.onRemove}>
							{t("REMOVE")}
						</Button>
					)) || <span />}
					<Button type={"submit"}>{t("SAVE")}</Button>
				</Group>
			</Stack>
		</form>
	);
}

function handleAddSymbolicLink(t: TranslateFunction, form: UserModReleaseForm) {
	openModal({
		title: t("ADD_SYMBOLIC_LINK"),
		size: "xl",
		children: (
			<_SymbolicLinkForm
				onSubmit={(v) => {
					form.insertListItem("symbolicLinks", v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function handleEditSymbolicLink(
	t: TranslateFunction,
	form: UserModReleaseForm,
	index: number,
) {
	openModal({
		title: t("EDIT_SYMBOLIC_LINK"),
		size: "xl",
		children: (
			<_SymbolicLinkForm
				defaultValues={form.values.symbolicLinks[index]}
				onRemove={() => {
					form.removeListItem("symbolicLinks", index);
					modals.closeAll();
				}}
				onSubmit={(v) => {
					form.replaceListItem("symbolicLinks", index, v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function _NoSymbolicLinks() {
	const { t } = useAppTranslation();
	return (
		<EmptyState
			title={t("NO_SYMBOLIC_LINKS_TITLE")}
			description={t("NO_SYMBOLIC_LINKS_DESCRIPTION")}
			icon={FaLink}
		/>
	);
}

export function _SymbolicLinks(props: { form: UserModReleaseForm }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						{t("SYMBOLIC_LINKS_TITLE")}
					</Text>
					<Group gap={"xs"}>
						<Button
							size={"xs"}
							variant={"light"}
							onClick={() => handleAddSymbolicLink(t, props.form)}
						>
							{t("ADD_SYMBOLIC_LINK")}
						</Button>
						<Help
							title={<Text fw={"bold"}>{t("SYMBOLIC_LINKS_TITLE")}</Text>}
							markdown={t("SYMBOLIC_LINK_HELP_MD")}
						/>
					</Group>
				</Group>
				{props.form.values.symbolicLinks.length === 0 && <_NoSymbolicLinks />}
				{props.form.values.symbolicLinks.map((it, index) => (
					<Alert
						icon={<FaLink />}
						title={
							<Group wrap="nowrap">
								<Badge variant={"light"} style={{ textTransform: "none" }}>
									{it.destRoot === SymbolicLinkDestRoot.DCS_WORKING_DIR
										? t("SYMBOLIC_LINK_DEST_ROOT_WORKING_DIR")
										: t("SYMBOLIC_LINK_DEST_ROOT_INSTALL_DIR")}
								</Badge>
							</Group>
						}
						key={`${it.src}-${it.dest}-${index}`}
						color="blue"
						variant="light"
						style={{ cursor: "pointer" }}
						onClick={() => handleEditSymbolicLink(t, props.form, index)}
					>
						<Stack gap={"xs"}>
							<Text size={"xs"} c={"dimmed"}>
								{t("SYMBOLIC_LINK_SOURCE_LABEL")}: {it.src}
							</Text>
							<Text size={"xs"} c={"dimmed"}>
								{t("SYMBOLIC_LINK_DESTINATION_LABEL")}: {it.dest}
							</Text>
						</Stack>
					</Alert>
				))}
			</Stack>
		</Card>
	);
}
