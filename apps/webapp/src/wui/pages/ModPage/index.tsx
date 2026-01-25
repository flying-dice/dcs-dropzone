import { Alert, Container, Skeleton } from "@mantine/core";
import { DzMain } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useParams } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetModById, useGetModReleaseById } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _Page } from "./page.tsx";

export function ModPage() {
	const { t } = useAppTranslation();
	const params = useParams<{ modId: string; releaseId: string }>();
	const mod = useGetModById(params.modId || "-");
	const latestReleaseId = mod.data?.status === StatusCodes.OK ? mod.data.data.mod.latestReleaseId : undefined;
	const latestRelease = useGetModReleaseById(
		params.modId || "-",
		params.releaseId === "latest" ? latestReleaseId || "-" : params.releaseId || "-",
	);

	return match(mod.data)
		.when(
			(res) => !res,
			() => <Skeleton height={200} />,
		)
		.when(
			(res) => res.status === StatusCodes.OK,
			(res) => (
				<_Page
					mod={res.data.mod}
					maintainers={res.data.maintainers}
					release={latestRelease.data?.status === StatusCodes.OK ? latestRelease.data?.data : undefined}
				/>
			),
		)
		.otherwise(() => (
			<DzMain>
				<Container p={"md"}>
					<Alert title={t("MOD_FETCH_ERROR_TITLE")} color={"red"}>
						{t("MOD_FETCH_ERROR_DESC")}
					</Alert>
				</Container>
			</DzMain>
		));
}
