import { Alert, Stack } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import { type ModData, type ModReleaseData, useGetModReleases } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _Release } from "./_Release.tsx";

export type _ReleasesProps = {
	mod: ModData;
	activeRelease?: ModReleaseData;
};

export function _Releases(props: _ReleasesProps) {
	const { t } = useAppTranslation();
	const releases = useGetModReleases(props.mod.id);

	return (
		<Stack>
			{match(releases.data)
				.when(
					(res) => res?.status === StatusCodes.OK,
					(res) =>
						res.data.data.map((release) => (
							<_Release
								key={release.id}
								active={props.activeRelease?.id === release.id}
								release={release}
								mod={props.mod}
							/>
						)),
				)
				.otherwise(() => (
					<Alert title={t("MOD_RELEASES_FETCH_ERROR_TITLE")} color={"red"}>
						{t("MOD_RELEASES_FETCH_ERROR_DESC")}
					</Alert>
				))}
		</Stack>
	);
}
