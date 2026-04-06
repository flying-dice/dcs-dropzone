import { Alert, Skeleton, Stack } from "@mantine/core";
import { useGetMods } from "@packages/clients/webapp";
import { AppIcons, EmptyState, useAppTranslation } from "@packages/dzui";
import { BROWSE_MODS_NO_MODS_FOUND_TEST_ID, MOD_CARD_TEST_ID } from "@packages/testids";
import { StatusCodes } from "http-status-codes";
import { times } from "lodash";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { ModCard } from "../../components/ModCard";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";

export function _ModsList(props: { page: number; size: number; filters: Record<string, unknown> }) {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const breakpoint = useBreakpoint();
	const mods = useGetMods({
		page: props.page,
		size: props.size,
		...props.filters,
	});

	return (
		<>
			{match(mods.data)
				.when(
					(res) => !res,
					() => times(4, () => <Skeleton height={130} />),
				)
				.when(
					(res) => res.status === StatusCodes.OK && res.data.data.length > 0,
					(res) => (
						<Stack>
							{res &&
								res.status === StatusCodes.OK &&
								res.data.data.map((mod) => (
									<ModCard
										key={mod.id}
										data-testid={MOD_CARD_TEST_ID(mod.id)}
										imageUrl={mod.thumbnail}
										category={mod.category}
										title={mod.name}
										summary={mod.description || ""}
										downloads={mod.downloadsCount}
										variant={breakpoint.isXs ? "grid" : "list"}
										onClick={() => nav(`${mod.id}/latest`)}
									/>
								))}
						</Stack>
					),
				)
				.when(
					(res) => res.status === StatusCodes.OK && res.data.data.length === 0,
					() => (
						<EmptyState
							data-testid={BROWSE_MODS_NO_MODS_FOUND_TEST_ID}
							withoutBorder
							title={t("NO_MODS_FOUND_TITLE")}
							description={t("NO_MODS_FOUND_SUBTITLE_DESC")}
							icon={AppIcons.Featured}
						/>
					),
				)
				.otherwise(() => (
					<Alert title={t("MODS_FETCH_ERROR_TITLE")} color={"red"}>
						{t("MODS_FETCH_ERROR_DESC")}
					</Alert>
				))}
		</>
	);
}
