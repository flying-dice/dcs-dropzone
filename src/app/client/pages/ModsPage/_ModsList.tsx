import { Stack } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import type { getModsResponse } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { ModCard } from "../../components/ModCard";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _ModsList(props: { mods: getModsResponse | undefined }) {
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();

	return (
		<>
			{match(props.mods)
				.when(
					(res) => res?.status === StatusCodes.OK && res.data.data.length > 0,
					(res) => (
						<Stack>
							{res && res.status === StatusCodes.OK && res.data.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									title={mod.name}
									summary={mod.description || ""}
									downloads={mod.downloadsCount}
									variant={breakpoint.isXs ? "grid" : "list"}
								/>
							))}
						</Stack>
					),
				)
				.otherwise(() => (
					<EmptyState
						withoutBorder
						title={t("NO_MODS_FOUND_TITLE")}
						description={t("NO_MODS_FOUND_SUBTITLE_DESC")}
						icon={AppIcons.Featured}
					/>
				))}
		</>
	);
}
