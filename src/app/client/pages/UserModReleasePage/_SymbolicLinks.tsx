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
import { EmptyState } from "../../components/EmptyState.tsx";
import { Help } from "../../components/Help.tsx";
import { SymbolicLinkDestRoot, type UserModReleaseForm } from "./form.ts";

const symbolicLinkFormSchema = z.object({
	src: z.string().min(1, "Source path is required"),
	dest: z.string().min(1, "Destination path is required"),
	destRoot: z.enum(SymbolicLinkDestRoot),
});
type SymbolicLinkFormValues = z.infer<typeof symbolicLinkFormSchema>;

function _SymbolicLinkForm(props: {
	defaultValues?: SymbolicLinkFormValues;
	onSubmit: (values: SymbolicLinkFormValues) => void;
	onRemove?: () => void;
}) {
	const form = useForm<SymbolicLinkFormValues>({
		initialValues: props.defaultValues || {
			src: "",
			dest: "",
			destRoot: "DCS_WORKING_DIR",
		},
		validate: zod4Resolver(symbolicLinkFormSchema),
	});

	const destRootOptions = [
		{ value: "DCS_WORKING_DIR", label: "DCS Working Directory" },
		{ value: "DCS_INSTALL_DIR", label: "DCS Install Directory" },
	];

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<TextInput
					label="Source Path"
					description="Path relative to the mod download directory"
					placeholder="e.g., Mods/MyMod or Scripts/MyScript.lua"
					name={"src"}
					{...form.getInputProps("src")}
				/>

				<Select
					label="Destination Root"
					description="Select the DCS directory root where the link will be created"
					data={destRootOptions}
					{...form.getInputProps("destRoot")}
				/>

				<TextInput
					label="Destination Path"
					description="Path relative to the selected destination root"
					placeholder="e.g., Mods/MyMod or Scripts/MyScript.lua"
					name={"dest"}
					{...form.getInputProps("dest")}
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

function handleAddSymbolicLink(form: UserModReleaseForm) {
	openModal({
		title: "Add Symbolic Link",
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

function handleEditSymbolicLink(form: UserModReleaseForm, index: number) {
	openModal({
		title: "Edit Symbolic Link",
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
	return (
		<EmptyState
			title="No symbolic links configured"
			description="Add symbolic links to be created when users enable your mod. Links are created from the mod directory to the DCS directories."
			icon={FaLink}
		/>
	);
}

export function _SymbolicLinks(props: { form: UserModReleaseForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						Symbolic Links
					</Text>
					<Group gap={"xs"}>
						<Button
							size={"xs"}
							variant={"light"}
							onClick={() => handleAddSymbolicLink(props.form)}
						>
							Add Symbolic Link
						</Button>
						<Help
							title={<Text fw={"bold"}>Symbolic Links</Text>}
							markdown={
								"Configure symbolic links to be created when users enable your mod. " +
								"These links allow your mod files to be accessed from the appropriate DCS directories.\n\n" +
								"**Source Path**: Relative to your mod's download directory\n" +
								"**Destination Root**: Choose between DCS Working Directory (user data) or DCS Install Directory (installation folder)\n" +
								"**Destination Path**: Relative to the selected destination root"
							}
						/>
					</Group>
				</Group>
				{props.form.values.symbolicLinks.length === 0 && <_NoSymbolicLinks />}
				{props.form.values.symbolicLinks.map((it, index) => (
					<Alert
						icon={<FaLink />}
						title={
							<Group>
								<Text size={"sm"} fw={"bold"}>
									{it.src} → {it.dest}
								</Text>
								<Badge variant={"light"} style={{ textTransform: "none" }}>
									{it.destRoot === "DCS_WORKING_DIR"
										? "Working Dir"
										: "Install Dir"}
								</Badge>
							</Group>
						}
						key={`${it.src}-${it.dest}-${index}`}
						color="blue"
						variant="light"
						style={{ cursor: "pointer" }}
						onClick={() => handleEditSymbolicLink(props.form, index)}
					>
						<Stack gap={"xs"}>
							<Text size={"xs"} c={"dimmed"}>
								Source: {it.src}
							</Text>
							<Text size={"xs"} c={"dimmed"}>
								Destination: {it.destRoot} / {it.dest}
							</Text>
						</Stack>
					</Alert>
				))}
			</Stack>
		</Card>
	);
}
