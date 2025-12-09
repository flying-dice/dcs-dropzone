import { Alert, Card, Stack } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import { type ModData, useGetModReleases } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _Release } from "./_Release.tsx";

export type _ReleasesProps = {
	mod: ModData;
};

export function _Releases(props: _ReleasesProps) {
	const { t } = useAppTranslation();
	const releases = useGetModReleases(props.mod.id);

	return (
		<Stack>
			{match(releases.data)
				.when(
					(res) => res?.status === StatusCodes.OK,
					(res) => res.data.data.map((release) => <_Release key={release.id} release={release} />),
				)
				.otherwise(() => (
					<Alert title={t("MOD_RELEASES_FETCH_ERROR_TITLE")} color={"red"}>
						{t("MOD_RELEASES_FETCH_ERROR_DESC")}
					</Alert>
				))}
		</Stack>
	);
}
