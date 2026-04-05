import { Button, Stack } from "@mantine/core";
import { ModAndReleaseDataStatus } from "@packages/clients/daemon";
import type { ModData, ModReleaseData } from "@packages/clients/webapp";
import { useDaemon } from "../hooks/useDaemon.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type ModReleaseDaemonControlsProps = {
	mod: ModData;
	release: ModReleaseData;
	form?: UserModReleaseForm;
	isUserModRelease: boolean;
};
export function ModReleaseDaemonControls(props: ModReleaseDaemonControlsProps) {
	const daemon = useDaemon();

	const daemonRelease = daemon.downloads?.find((it) => it.releaseId === props.release.id);

	return (
		<Stack gap={"xs"}>
			{daemonRelease?.status && (
				<Button
					data-testid="toggle-release-button"
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
					data-testid="remove-release-button"
					variant={"light"}
					onClick={() => daemon.remove(daemonRelease.releaseId)}
					loading={daemon.removing.loading}
					disabled={daemon.isUnavailable || daemonRelease.status === ModAndReleaseDataStatus.ENABLED}
				>
					{daemonRelease.status === ModAndReleaseDataStatus.IN_PROGRESS ? "Cancel" : "Remove"}
				</Button>
			) : (
				<Button
					data-testid="download-release-button"
					variant={"light"}
					onClick={() => daemon.add(props.isUserModRelease, props.mod.id, props.release.id, props.form)}
					loading={daemon.adding.loading}
					disabled={daemon.isUnavailable}
				>
					Download
				</Button>
			)}
		</Stack>
	);
}
