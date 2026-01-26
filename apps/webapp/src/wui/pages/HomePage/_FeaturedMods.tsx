import { Center, Flex, Group, Stack, Text } from "@mantine/core";
import { AppIcons, EmptyState, useAppTranslation } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { useGetFeaturedMods } from "../../_autogen/api.ts";
import { ModCard } from "../../components/ModCard";

export function _FeaturedMods() {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const featuredMods = useGetFeaturedMods();

	return (
		<Stack>
			<Text fz={"lg"} fw={"bold"}>
				{t("FEATURED_MODS")}
			</Text>
			{match(featuredMods.data)
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
											onClick={() => nav(`/mods/${mod.id}/latest`)}
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
