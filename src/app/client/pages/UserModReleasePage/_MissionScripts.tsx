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
import { FaFileCode } from "react-icons/fa";
import { z } from "zod";
import {
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../../../common/data.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { Help } from "../../components/Help.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "./form.ts";

const missionScriptFormSchema = z.object({
	path: z.string().min(1, "Path is required"),
	root: z.nativeEnum(SymbolicLinkDestRoot),
	runOn: z.nativeEnum(MissionScriptRunOn),
});
type MissionScriptFormValues = z.infer<typeof missionScriptFormSchema>;

function _MissionScriptForm(props: {
	defaultValues?: MissionScriptFormValues;
	onSubmit: (values: MissionScriptFormValues) => void;
	onRemove?: () => void;
}) {
	const { t } = useAppTranslation();
	const form = useForm<MissionScriptFormValues>({
		initialValues: props.defaultValues || {
			path: "",
			root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			runOn: MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
		},
		validate: zod4Resolver(missionScriptFormSchema),
	});

	const rootOptions = [
		{
			value: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			label: t("MISSION_SCRIPT_ROOT_WORKING_DIR"),
		},
		{
			value: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
			label: t("MISSION_SCRIPT_ROOT_INSTALL_DIR"),
		},
	];

	const runOnOptions = [
		{
			value: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			label: t("MISSION_SCRIPT_RUN_ON_BEFORE_SANITIZE"),
		},
		{
			value: MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			label: t("MISSION_SCRIPT_RUN_ON_AFTER_SANITIZE"),
		},
	];

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<TextInput
					label={t("MISSION_SCRIPT_PATH_LABEL")}
					description={t("MISSION_SCRIPT_PATH_DESCRIPTION")}
					placeholder={t("MISSION_SCRIPT_PATH_PLACEHOLDER")}
					name={"path"}
					{...form.getInputProps("path")}
				/>

				<Select
					label={t("MISSION_SCRIPT_ROOT_LABEL")}
					description={t("MISSION_SCRIPT_ROOT_DESCRIPTION")}
					data={rootOptions}
					{...form.getInputProps("root")}
				/>

				<Select
					label={t("MISSION_SCRIPT_RUN_ON_LABEL")}
					description={t("MISSION_SCRIPT_RUN_ON_DESCRIPTION")}
					data={runOnOptions}
					{...form.getInputProps("runOn")}
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

function handleAddMissionScript(form: UserModReleaseForm) {
	const { t } = useAppTranslation();
	openModal({
		title: t("ADD_MISSION_SCRIPT"),
		size: "xl",
		children: (
			<_MissionScriptForm
				onSubmit={(v) => {
					form.insertListItem("missionScripts", v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function handleEditMissionScript(form: UserModReleaseForm, index: number) {
	const { t } = useAppTranslation();
	openModal({
		title: t("EDIT_MISSION_SCRIPT"),
		size: "xl",
		children: (
			<_MissionScriptForm
				defaultValues={form.values.missionScripts[index]}
				onRemove={() => {
					form.removeListItem("missionScripts", index);
					modals.closeAll();
				}}
				onSubmit={(v) => {
					form.replaceListItem("missionScripts", index, v);
					modals.closeAll();
				}}
			/>
		),
	});
}

function _NoMissionScripts() {
	const { t } = useAppTranslation();
	return (
		<EmptyState
			title={t("NO_MISSION_SCRIPTS_TITLE")}
			description={t("NO_MISSION_SCRIPTS_DESCRIPTION")}
			icon={FaFileCode}
		/>
	);
}

function getMissionScriptRunOnLabel(runOn: MissionScriptRunOn, t: any) {
	switch (runOn) {
		case MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE:
			return t("MISSION_SCRIPT_RUN_ON_BEFORE_SANITIZE");
		case MissionScriptRunOn.MISSION_START_AFTER_SANITIZE:
			return t("MISSION_SCRIPT_RUN_ON_AFTER_SANITIZE");
		default:
			return runOn;
	}
}

function getMissionScriptRootLabel(root: SymbolicLinkDestRoot, t: any) {
	switch (root) {
		case SymbolicLinkDestRoot.DCS_WORKING_DIR:
			return t("MISSION_SCRIPT_ROOT_WORKING_DIR");
		case SymbolicLinkDestRoot.DCS_INSTALL_DIR:
			return t("MISSION_SCRIPT_ROOT_INSTALL_DIR");
		default:
			return root;
	}
}

export function _MissionScripts(props: { form: UserModReleaseForm }) {
	const { t } = useAppTranslation();
	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						{t("MISSION_SCRIPTS_TITLE")}
					</Text>
					<Group gap={"xs"}>
						<Button
							size={"xs"}
							variant={"light"}
							onClick={() => handleAddMissionScript(props.form)}
						>
							{t("ADD_MISSION_SCRIPT")}
						</Button>
						<Help
							title={<Text fw={"bold"}>{t("MISSION_SCRIPTS_TITLE")}</Text>}
							markdown={t("MISSION_SCRIPT_HELP_MD")}
						/>
					</Group>
				</Group>
				{props.form.values.missionScripts.length === 0 && <_NoMissionScripts />}
				{props.form.values.missionScripts.map((it, index) => (
					<Alert
						icon={<FaFileCode />}
						title={
							<Group wrap="nowrap">
								<Badge variant={"light"} style={{ textTransform: "none" }}>
									{getMissionScriptRunOnLabel(it.runOn, t)}
								</Badge>
								<Badge variant={"outline"} style={{ textTransform: "none" }}>
									{getMissionScriptRootLabel(it.root, t)}
								</Badge>
							</Group>
						}
						key={`${it.path}-${it.root}-${it.runOn}-${index}`}
						color="violet"
						variant="light"
						style={{ cursor: "pointer" }}
						onClick={() => handleEditMissionScript(props.form, index)}
					>
						<Stack gap={"xs"}>
							<Text size={"xs"} c={"dimmed"}>
								{t("MISSION_SCRIPT_PATH_DISPLAY")}: {it.path}
							</Text>
						</Stack>
					</Alert>
				))}
			</Stack>
		</Card>
	);
}
