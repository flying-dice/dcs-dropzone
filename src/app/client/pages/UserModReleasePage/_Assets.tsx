import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Card,
	Checkbox,
	Divider,
	Group,
	List,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals, openModal } from "@mantine/modals";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaFileArchive } from "react-icons/fa";
import { FaFile, FaInfo, FaTrash } from "react-icons/fa6";
import { z } from "zod";
import type { UserModReleaseForm } from "./form.ts";

const assetFormSchema = z.object({
	name: z.string().min(1, "Asset name is required"),
	urls: z
		.string()
		.url("Invalid URL format")
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
	const form = useForm<AssetFormValues>({
		initialValues: props.defaultValues || {
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
					label="Asset Name"
					name={"name"}
					{...form.getInputProps("name")}
				/>

				<Stack gap={"xs"}>
					<Group justify={"space-between"}>
						<Text fw={"bold"} size={"sm"}>
							Asset URLs
						</Text>
						<Button
							size={"xs"}
							variant={"subtle"}
							onClick={() =>
								form.setFieldValue("urls", [...form.values.urls, ""])
							}
						>
							Add URL
						</Button>
					</Group>
					{form.values.urls.length === 0 && !form.errors.urls && (
						<Alert>Add a URL to the asset.</Alert>
					)}
					{form.errors.urls && <Alert color="red">{form.errors.urls}</Alert>}
					{form.values.urls.map((url, i) => (
						<TextInput
							key={i + url}
							name={`urls[${i}]`}
							rightSection={
								<ActionIcon
									variant={"subtle"}
									color={"red"}
									onClick={() => {
										const newUrls = [...form.values.urls];
										newUrls.splice(i, 1);
										form.setFieldValue("urls", newUrls);
									}}
								>
									<FaTrash />
								</ActionIcon>
							}
							{...form.getInputProps(`urls.${i}`)}
						/>
					))}
				</Stack>

				<Divider />
				<Checkbox
					label={"Is Archive"}
					description={"Asset is an archive (will be extracted using 7-zip)"}
					{...form.getInputProps("isArchive", { type: "checkbox" })}
				/>

				<Group justify={"space-between"}>
					{(props.onRemove && (
						<Button color="red" variant="light" onClick={props.onRemove}>
							Remove
						</Button>
					)) || <span />}
					<Button type={"submit"}>Save</Button>
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

export function _Assets(props: { form: UserModReleaseForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						Assets
					</Text>
					<Button variant={"light"} onClick={() => handleAddAsset(props.form)}>
						Add Asset
					</Button>
				</Group>
				<Alert variant="light" color="gray" icon={<FaInfo />}>
					<Stack>
						<Text size={"sm"}>
							Assets are files associated with this release, such as
							downloadable content or resources. Make sure to provide valid URLs
							for each asset.
						</Text>
						<Text size={"sm"}>
							Assets are downloaded into the Mods folder, archives are extracted
							using 7-zip.
						</Text>
					</Stack>
				</Alert>
				{props.form.values.assets.map((it) => (
					<Alert
						icon={it.isArchive ? <FaFileArchive /> : <FaFile />}
						title={
							<Group>
								<Text size={"sm"} fw={"bold"}>
									{it.name}
								</Text>
								{it.isArchive && (
									<Badge variant={"light"} style={{ textTransform: "none" }}>
										Archive
									</Badge>
								)}
							</Group>
						}
						key={it.name}
						color="blue"
						variant="light"
						style={{ cursor: "pointer" }}
						onClick={() =>
							handleEditAsset(props.form, props.form.values.assets.indexOf(it))
						}
					>
						<List type="ordered">
							{it.urls.map((url) => (
								<List.Item key={url}>{url}</List.Item>
							))}
						</List>
					</Alert>
				))}
			</Stack>
		</Card>
	);
}
