import { Button, Card, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals, openModal } from "@mantine/modals";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaFileCode } from "react-icons/fa";
import { z } from "zod";
import { ModReleaseMissionScriptDataRoot, ModReleaseMissionScriptDataRunOn } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { Help } from "../../components/Help.tsx";
import { MissionScriptListItem } from "../../components/MissionScriptListItem.tsx";
import { type TranslateFunction, useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { UserModReleaseForm } from "./form.ts";

const missionScriptFormSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1, "Name is required"),
	purpose: z.string().min(1, "Purpose is required"),
	path: z.string().min(1, "Path is required"),
	root: z.enum(ModReleaseMissionScriptDataRoot),
	runOn: z.enum(ModReleaseMissionScriptDataRunOn),
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
			id: crypto.randomUUID(),
			name: "",
			purpose: "",
			path: "",
			root: "DCS_WORKING_DIR",
			runOn: "MISSION_START_AFTER_SANITIZE",
		},
		validate: zod4Resolver(missionScriptFormSchema),
	});

	const rootOptions = [
		{
			value: "DCS_WORKING_DIR",
			label: t("MISSION_SCRIPT_ROOT_WORKING_DIR"),
		},
		{
			value: "DCS_INSTALL_DIR",
			label: t("MISSION_SCRIPT_ROOT_INSTALL_DIR"),
		},
	];

	const runOnOptions = [
		{
			value: "MISSION_START_BEFORE_SANITIZE",
			label: t("MISSION_SCRIPT_RUN_ON_BEFORE_SANITIZE"),
		},
		{
			value: "MISSION_START_AFTER_SANITIZE",
			label: t("MISSION_SCRIPT_RUN_ON_AFTER_SANITIZE"),
		},
	];

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<TextInput
					label={t("MISSION_SCRIPT_NAME_LABEL")}
					description={t("MISSION_SCRIPT_NAME_DESCRIPTION")}
					placeholder={t("MISSION_SCRIPT_NAME_PLACEHOLDER")}
					{...form.getInputProps("name")}
				/>

				<TextInput
					label={t("MISSION_SCRIPT_PURPOSE_LABEL")}
					description={t("MISSION_SCRIPT_PURPOSE_DESCRIPTION")}
					placeholder={t("MISSION_SCRIPT_PURPOSE_PLACEHOLDER")}
					{...form.getInputProps("purpose")}
				/>

				<Select
					label={t("MISSION_SCRIPT_ROOT_LABEL")}
					description={t("MISSION_SCRIPT_ROOT_DESCRIPTION")}
					data={rootOptions}
					{...form.getInputProps("root")}
				/>

				<TextInput
					label={t("MISSION_SCRIPT_PATH_LABEL")}
					description={t("MISSION_SCRIPT_PATH_DESCRIPTION")}
					placeholder={t("MISSION_SCRIPT_PATH_PLACEHOLDER")}
					{...form.getInputProps("path")}
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

function handleAddMissionScript(t: TranslateFunction, form: UserModReleaseForm) {
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

function handleEditMissionScript(t: TranslateFunction, form: UserModReleaseForm, index: number) {
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
						<Button size={"xs"} variant={"light"} onClick={() => handleAddMissionScript(t, props.form)}>
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
					<MissionScriptListItem
						key={`${it.path}-${it.root}-${it.runOn}-${index}`}
						onClick={() => handleEditMissionScript(t, props.form, index)}
						name={it.name}
						root={it.root}
						runOn={it.runOn}
						path={it.path}
						purpose={it.purpose}
					/>
				))}
			</Stack>
		</Card>
	);
}
