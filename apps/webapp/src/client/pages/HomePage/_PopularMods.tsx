import { Button, Center, Group, Stack, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetPopularMods } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { ModCard } from "../../components/ModCard";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _PopularMods() {
	const nav = useNavigate();
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();
	const popularMods = useGetPopularMods();

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("POPULAR_MODS")}
			</Text>

			{match(popularMods.data)
				.when(
					(res) => res?.status === StatusCodes.OK && res.data.length > 0,
					(res) => (
						<>
							{res &&
								res.status === StatusCodes.OK &&
								res.data.map((mod) => (
									<ModCard
										key={mod.id}
										imageUrl={mod.thumbnail}
										category={mod.category}
										title={mod.name}
										summary={mod.description || ""}
										downloads={mod.downloadsCount}
										isDownloaded={false}
										variant={breakpoint.isXs ? "grid" : "list"}
										onClick={() => nav(`/mods/${mod.id}`)}
									/>
								))}
							<Group justify={"center"}>
								<Button
									variant={"default"}
									onClick={async () => {
										await nav("/mods");
									}}
								>
									{t("VIEW_ALL_MODS")}
								</Button>
							</Group>
						</>
					),
				)
				.otherwise(() => (
					<Center>
						<EmptyState
							withoutBorder
							title={t("NO_POPULAR_MODS_FOUND_TITLE")}
							description={t("NO_POPULAR_MODS_FOUND_SUBTITLE_DESC")}
							icon={AppIcons.Mods}
						/>
					</Center>
				))}
		</Stack>
	);
}
