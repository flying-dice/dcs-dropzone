import { Center, Flex, Group, Stack, Text } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import type { getFeaturedModsResponse } from "../../_autogen/api.ts";
import { EmptyState } from "../../components/EmptyState.tsx";
import { ModCard } from "../../components/ModCard";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { AppIcons } from "../../icons.ts";

export function _FeaturedMods(props: { featuredMods: getFeaturedModsResponse | undefined }) {
	const { t } = useAppTranslation();

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("FEATURED_MODS")}
			</Text>
			{match(props.featuredMods)
				.when(
					(res) => res?.status === StatusCodes.OK && res.data.length > 0,
					(res) => (
						<Group align={"stretch"}>
							{res &&
								res.status === StatusCodes.OK &&
								res.data.map((mod) => (
									<Flex w={250} key={mod.id} flex={"auto"}>
										<ModCard
											imageUrl={mod.thumbnail}
											category={mod.category}
											title={mod.name}
											summary={mod.description || ""}
											downloads={mod.downloadsCount}
											isDownloaded={false}
											variant={"grid"}
										/>
									</Flex>
								))}
						</Group>
					),
				)
				.otherwise(() => (
					<Center>
						<EmptyState
							withoutBorder
							title={t("NO_FEATURED_MODS_FOUND_TITLE")}
							description={t("NO_FEATURED_MODS_FOUND_SUBTITLE_DESC")}
							icon={AppIcons.Featured}
						/>
					</Center>
				))}
		</Stack>
	);
}
