import { AppShell, Button, Center, Container, Flex, Group, Stack, Text, useComputedColorScheme } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import { type getFeaturedModsResponseSuccess, useGetFeaturedMods, useGetMods } from "../_autogen/api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard";
import { StatCard } from "../components/StatCard.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useDaemon } from "../hooks/useDaemon.ts";
import { AppIcons } from "../icons.ts";
import { orDefaultValue } from "../utils/orDefaultValue.ts";

export function Homepage() {
	const nav = useNavigate();
	const { t } = useTranslation();
	const colorScheme = useComputedColorScheme();
	const breakpoint = useBreakpoint();

	const { downloadCount, enabledCount, outdatedCount } = useDaemon();
	const featuredMods = useGetFeaturedMods();
	const mods = useGetMods({ page: 1, size: 10 });

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<Group>
						<StatCard
							icon={AppIcons.Mods}
							label={t("TOTAL_MODS")}
							value={match(mods.data)
								.when(
									(res) => res?.status === StatusCodes.OK,
									(res) => res.data.page.totalElements,
								)
								.otherwise(() => "-")}
						/>
						<StatCard
							icon={AppIcons.Downloaded}
							iconColor={"grape"}
							label={t("DOWNLOADS")}
							value={orDefaultValue(downloadCount, "-")}
						/>
						<StatCard
							icon={AppIcons.Enabled}
							iconColor={"green"}
							label={t("ENABLED")}
							value={orDefaultValue(enabledCount, "-")}
						/>
						<StatCard
							icon={AppIcons.Updates}
							iconColor={"orange"}
							label={t("UPDATES")}
							value={orDefaultValue(outdatedCount, "-")}
						/>
					</Group>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("FEATURED_MODS")}
						</Text>
						{match(featuredMods.data)
							.when(
								(res) => res?.status === StatusCodes.OK && res.data.length > 0,
								(res: getFeaturedModsResponseSuccess) => (
									<Group align={"stretch"}>
										{res.data.map((mod) => (
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
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("POPULAR_MODS")}
						</Text>

						{match(mods.data)
							.when(
								(res) => res?.status === StatusCodes.OK,
								(res) =>
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
				</Stack>
			</Container>
		</AppShell.Main>
	);
}
