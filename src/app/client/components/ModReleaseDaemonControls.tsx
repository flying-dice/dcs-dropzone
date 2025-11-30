import { Button, Stack } from "@mantine/core";
import type { ModData, ModReleaseData } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus } from "../_autogen/daemon_api.ts";
import { useDaemonSubscriber } from "../hooks/useDaemonSubscriber.ts";
import type { UserModReleaseForm } from "../pages/UserModReleasePage/form.ts";

export type ModReleaseDaemonControlsProps = {
	mod: ModData;
	release: ModReleaseData;
	form?: UserModReleaseForm;
};
export function ModReleaseDaemonControls(props: ModReleaseDaemonControlsProps) {
	const daemon = useDaemonSubscriber(props.mod, props.release, props.form);

	return (
		<Stack gap={"xs"}>
			{daemon.subscription?.status && (
				<Button
					variant={"light"}
					onClick={daemon.toggle}
					loading={daemon.toggling.loading}
					disabled={
						!(
							daemon.subscription.status === ModAndReleaseDataStatus.DISABLED ||
							daemon.subscription.status === ModAndReleaseDataStatus.ENABLED
						)
					}
				>
					{daemon.subscription.status === ModAndReleaseDataStatus.ENABLED
						? "Disable"
						: "Enable"}
				</Button>
			)}
			{daemon.subscription ? (
				<Button
					variant={"light"}
					onClick={daemon.unsubscribe}
					loading={daemon.unsubscribing.loading}
					disabled={
						daemon.isUnavailable ||
						daemon.subscription.status === ModAndReleaseDataStatus.ENABLED
					}
				>
					{daemon.subscription.status === ModAndReleaseDataStatus.IN_PROGRESS
						? "Cancel"
						: "Unsubscribe"}
				</Button>
			) : (
				<Button
					variant={"light"}
					onClick={daemon.subscribe}
					loading={daemon.subscribing.loading}
					disabled={daemon.isUnavailable}
				>
					Subscribe
				</Button>
			)}
		</Stack>
	);
}
