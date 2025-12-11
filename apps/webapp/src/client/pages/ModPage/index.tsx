import { Alert, AppShell, Container, Skeleton, useComputedColorScheme } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useParams } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetLatestModReleaseById, useGetModById } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _Page } from "./page.tsx";

export function ModPage() {
	const { t } = useAppTranslation();
	const colorScheme = useComputedColorScheme();
	const params = useParams<{ modId: string }>();
	const mod = useGetModById(params.modId || "undefined");
	const latestRelease = useGetLatestModReleaseById(params.modId || "undefined");

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
					latestRelease={latestRelease.data?.status === StatusCodes.OK ? latestRelease.data?.data : undefined}
				/>
			),
		)
		.otherwise(() => (
			<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
				<Container size={"xl"} p={"md"}>
					<Alert title={t("MOD_FETCH_ERROR_TITLE")} color={"red"}>
						{t("MOD_FETCH_ERROR_DESC")}
					</Alert>
				</Container>
			</AppShell.Main>
		));
}
