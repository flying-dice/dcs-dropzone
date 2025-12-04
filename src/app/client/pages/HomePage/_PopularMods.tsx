import { Button, Group, Stack, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetMods } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { ModCard } from "../../components/ModCard";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _PopularMods() {
	const nav = useNavigate();
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();
	const mods = useGetMods({ page: 1, size: 10 });

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("POPULAR_MODS")}
			</Text>

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
								isDownloaded={false}
								variant={breakpoint.isXs ? "grid" : "list"}
							/>
						)),
				)
				.otherwise(() => (
					<EmptyState
						withoutBorder
						title={t("NO_POPULAR_MODS_FOUND_TITLE")}
						description={t("NO_POPULAR_MODS_FOUND_SUBTITLE_DESC")}
						icon={AppIcons.Mods}
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
		</Stack>
	);
}
