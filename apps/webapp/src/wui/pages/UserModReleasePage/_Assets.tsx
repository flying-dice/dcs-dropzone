import { ActionIcon, Alert, Button, Card, Checkbox, Divider, Group, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals, openModal } from "@mantine/modals";
import { EmptyState, useAppTranslation } from "@packages/dzui";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { FaFile, FaTrash } from "react-icons/fa6";
import { z } from "zod";
import { AssetListItem } from "../../components/AssetListItem.tsx";
import { Help } from "../../components/Help.tsx";
import type { UserModReleaseForm } from "./form.ts";

const assetFormSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Asset name is required"),
	urls: z
		.object({
			id: z.string(),
			url: z.url("Invalid URL format"),
		})
		.array()
		.min(1, "At least one URL is required"),
	isArchive: z.boolean(),
});
type AssetFormValues = z.infer<typeof assetFormSchema>;

function _AssetForm(props: {
	defaultValues?: AssetFormValues;
	onSubmit: (values: AssetFormValues) => void;
	onRemove?: () => void;
}) {
	const { t } = useAppTranslation();
	const form = useForm<AssetFormValues>({
		initialValues: props.defaultValues || {
			id: crypto.randomUUID(),
			name: "",
			urls: [],
			isArchive: false,
		},
		validate: zod4Resolver(assetFormSchema),
	});

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<TextInput
					label={t("ASSET_NAME_LABEL")}
					description={t("ASSET_NAME_DESCRIPTION")}
					name={"name"}
					{...form.getInputProps("name")}
				/>

				<Stack gap={"xs"}>
					<Group justify={"space-between"}>
						<Stack gap={0}>
							<Text size={"sm"}>{t("ASSET_URLS_LABEL")}</Text>
							<Text size={"xs"} c={"dimmed"}>
								{t("ASSET_URLS_DESCRIPTION")}
							</Text>
						</Stack>
						<Button
							size={"xs"}
							variant={"subtle"}
							onClick={() => form.insertListItem("urls", { id: crypto.randomUUID(), url: "" })}
						>
							{t("ADD_URL")}
						</Button>
					</Group>
					{form.values.urls.length === 0 && !form.errors.urls && (
						<EmptyState
							title={t("EMPTY_ASSET_URLS_TITLE")}
							description={t("EMPTY_ASSET_URLS_DESCRIPTION")}
							icon={FaCloudDownloadAlt}
						/>
					)}
					{form.errors.urls && <Alert color="red">{form.errors.urls}</Alert>}
					{form.values.urls.map((url, i) => (
						<TextInput
							key={url.id}
							name={`urls[${i}]`}
							rightSection={
								<ActionIcon
									variant={"subtle"}
									color={"red"}
									onClick={() => {
										form.removeListItem("urls", i);
									}}
								>
									<FaTrash />
								</ActionIcon>
							}
							{...form.getInputProps(`urls.${i}.url`)}
						/>
					))}
				</Stack>

				<Divider />
				<Checkbox
					label={t("ASSET_IS_ARCHIVE_LABEL")}
					description={t("ASSET_IS_ARCHIVE_DESCRIPTION")}
					{...form.getInputProps("isArchive", { type: "checkbox" })}
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

function handleAddAsset(form: UserModReleaseForm) {
	openModal({
		title: "Add Asset",
		size: "xl",
		children: (
			<_AssetForm
				onSubmit={(v) => {
					form.insertListItem("assets", v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function handleEditAsset(form: UserModReleaseForm, index: number) {
	openModal({
		title: "Edit Asset",
		size: "xl",
		children: (
			<_AssetForm
				defaultValues={form.values.assets[index]}
				onRemove={() => {
					form.removeListItem("assets", index);
					modals.closeAll();
				}}
				onSubmit={(v) => {
					form.replaceListItem("assets", index, v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function _NoAssets() {
	return (
		<EmptyState
			title="No assets added"
			description="Add Assets & URLs for your mod files. These will be downloaded and extracted by the desktop client."
			icon={FaFile}
		/>
	);
}

export function _Assets(props: { form: UserModReleaseForm }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						Assets
					</Text>
					<Group gap={"xs"}>
						<Button size={"xs"} variant={"light"} onClick={() => handleAddAsset(props.form)}>
							Add Asset
						</Button>
						<Help title={<Text fw={"bold"}>Assets</Text>} markdown={t("ASSET_HELP_MD")} />
					</Group>
				</Group>
				{props.form.values.assets.length === 0 && <_NoAssets />}
				{props.form.values.assets.map((it) => (
					<AssetListItem
						key={it.id}
						name={it.name}
						urls={it.urls}
						isArchive={it.isArchive}
						onClick={() => handleEditAsset(props.form, props.form.values.assets.indexOf(it))}
					/>
				))}
			</Stack>
		</Card>
	);
}
