import { Button, Card, Divider, Group, Select, Stack, Text } from "@mantine/core";
import { modals, openModal } from "@mantine/modals";
import { AppIcons, EmptyState, showErrorNotification } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { createUserModRelease, type ModData, useGetUserModReleases } from "../../_autogen/api.ts";
import { NewReleaseForm } from "../../components/NewReleaseForm.tsx";
import { UserModRelease } from "../../components/UserModRelease.tsx";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { UserModForm } from "./form.ts";

export function _Releases(props: { form: UserModForm; mod: ModData }) {
	const nav = useNavigate();
	const modReleases = useGetUserModReleases(props.mod.id);
	const { t } = useAppTranslation();

	const footerText =
		modReleases.data?.status === StatusCodes.OK ? `Total Releases: ${modReleases.data.data.data.length}` : `Loading...`;

	const handleNewRelease = () => {
		openModal({
			title: t("CREATE_NEW_RELEASE"),
			size: "xl",
			children: (
				<NewReleaseForm
					onSubmit={async (v) => {
						try {
							const res = await createUserModRelease(props.mod.id, {
								version: v.version,
							});
							if (res.status !== StatusCodes.CREATED) {
								throw new Error(`Failed to create mod: ${res.status}`);
							}
							await modReleases.refetch();
							modals.closeAll();
							nav(`releases/${res.data.id}`);
						} catch (e) {
							showErrorNotification(e);
						}
					}}
					onCancel={modals.closeAll}
				/>
			),
		});
	};

	const releaseOptions =
		modReleases.data?.status === StatusCodes.OK
			? modReleases.data.data.data.map((release) => ({
					value: release.id,
					label: `${release.version} (${release.visibility})`,
				}))
			: [];

	return (
		<Card withBorder>
			<Stack>
				<Group justify={"space-between"}>
					<Text size={"lg"} fw={"bold"}>
						Releases
					</Text>
					<Button size={"xs"} variant={"light"} onClick={handleNewRelease}>
						New Release
					</Button>
				</Group>

				{modReleases.data?.status === StatusCodes.OK && (
					<>
						<Select
							label={t("LATEST_RELEASE_LABEL")}
							description={t("LATEST_RELEASE_DESCRIPTION")}
							placeholder={t("LATEST_RELEASE_PLACEHOLDER")}
							data={releaseOptions}
							clearable
							disabled={modReleases.data.data?.data.length === 0}
							{...props.form.getInputProps("latestReleaseId")}
						/>
						<Divider />
					</>
				)}

				{modReleases.data?.status === StatusCodes.OK && modReleases.data.data?.data.length === 0 && (
					<EmptyState
						title={t("EMPTY_RELEASES_TITLE")}
						description={t("EMPTY_RELEASES_DESCRIPTION")}
						icon={AppIcons.Releases}
					/>
				)}
				{modReleases.data?.status === StatusCodes.OK &&
					modReleases.data.data.data.map((release) => (
						<UserModRelease key={release.id} release={release} onClick={() => nav(`releases/${release.id}`)} />
					))}

				<Divider />
				<Text c={"dimmed"} size={"xs"}>
					{footerText}
				</Text>
			</Stack>
		</Card>
	);
}
