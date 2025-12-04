import { Stack } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetUserMods } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { ModCard } from "../../components/ModCard";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _UserModsList() {
	const nav = useNavigate();
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();
	const mods = useGetUserMods();

	return (
		<Stack>
			{match(mods.data)
				.when(
					(res) => res?.status === StatusCodes.OK,
					(res) =>
						res &&
						res.status === StatusCodes.OK &&
						res.data.data.map((mod) => (
							<ModCard
								key={mod.id}
								imageUrl={mod.thumbnail}
								category={mod.category}
								title={mod.name}
								summary={mod.description || ""}
								downloads={mod.downloadsCount}
								variant={breakpoint.isXs ? "grid" : "list"}
								onClick={() => nav(mod.id)}
							/>
						)),
				)
				.otherwise(() => (
					<EmptyState
						title={t("NO_USER_MODS_TITLE")}
						description={t("NO_USER_MODS_SUBTITLE_DESC")}
						icon={AppIcons.Mods}
					/>
				))}
		</Stack>
	);
}
