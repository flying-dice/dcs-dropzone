import { Button, Stack } from "@mantine/core";
import type { ModData, ModReleaseData } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus } from "../_autogen/daemon_api.ts";
import { useDaemonDownloader } from "../hooks/useDaemon.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type ModReleaseDaemonControlsProps = {
	mod: ModData;
	release: ModReleaseData;
	form?: UserModReleaseForm;
};
export function ModReleaseDaemonControls(props: ModReleaseDaemonControlsProps) {
	const daemon = useDaemonDownloader(props.mod, props.release, props.form);

	return (
		<Stack gap={"xs"}>
			{daemon.daemonRelease?.status && (
				<Button
					variant={"light"}
					onClick={daemon.toggle}
					loading={daemon.toggling.loading}
					disabled={
						!(
							daemon.daemonRelease.status ===
								ModAndReleaseDataStatus.DISABLED ||
							daemon.daemonRelease.status === ModAndReleaseDataStatus.ENABLED
						)
					}
				>
					{daemon.daemonRelease.status === ModAndReleaseDataStatus.ENABLED
						? "Disable"
						: "Enable"}
				</Button>
			)}
			{daemon.daemonRelease ? (
				<Button
					variant={"light"}
					onClick={daemon.remove}
					loading={daemon.removing.loading}
					disabled={
						daemon.isUnavailable ||
						daemon.daemonRelease.status === ModAndReleaseDataStatus.ENABLED
					}
				>
					{daemon.daemonRelease.status === ModAndReleaseDataStatus.IN_PROGRESS
						? "Cancel"
						: "Remove"}
				</Button>
			) : (
				<Button
					variant={"light"}
					onClick={daemon.add}
					loading={daemon.adding.loading}
					disabled={daemon.isUnavailable}
				>
					Download
				</Button>
			)}
		</Stack>
	);
}
