import { Button, Stack } from "@mantine/core";
import type { ModData, ModReleaseData } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus } from "../_autogen/daemon_api.ts";
import { useDaemon } from "../hooks/useDaemon.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type ModReleaseDaemonControlsProps = {
	mod: ModData;
	release: ModReleaseData;
	form?: UserModReleaseForm;
};
export function ModReleaseDaemonControls(props: ModReleaseDaemonControlsProps) {
	const daemon = useDaemon();

	const daemonRelease = daemon.downloads?.find((it) => it.releaseId === props.release.id);

	return (
		<Stack gap={"xs"}>
			{daemonRelease?.status && (
				<Button
					variant={"light"}
					onClick={() => daemon.toggle(daemonRelease.releaseId)}
					loading={daemon.toggling.loading}
					disabled={
						!(
							daemonRelease.status === ModAndReleaseDataStatus.DISABLED ||
							daemonRelease.status === ModAndReleaseDataStatus.ENABLED
						)
					}
				>
					{daemonRelease.status === ModAndReleaseDataStatus.ENABLED ? "Disable" : "Enable"}
				</Button>
			)}
			{daemonRelease ? (
				<Button
					variant={"light"}
					onClick={() => daemon.remove(daemonRelease.releaseId)}
					loading={daemon.removing.loading}
					disabled={daemon.isUnavailable || daemonRelease.status === ModAndReleaseDataStatus.ENABLED}
				>
					{daemonRelease.status === ModAndReleaseDataStatus.IN_PROGRESS ? "Cancel" : "Remove"}
				</Button>
			) : (
				<Button
					variant={"light"}
					onClick={() => daemon.add(props.mod.id, props.release.id, props.form)}
					loading={daemon.adding.loading}
					disabled={daemon.isUnavailable}
				>
					Download
				</Button>
			)}
		</Stack>
	);
}
