import {
	AppShell,
	Button,
	Container,
	Flex,
	Group,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGetFeaturedMods, useGetMods } from "../_autogen/api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { AppIcons } from "../icons.ts";

export function Homepage() {
	const nav = useNavigate();
	const { t } = useTranslation();
	const colorScheme = useComputedColorScheme();
	const breakpoint = useBreakpoint();

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
							value={mods.data?.data.page.totalElements || "-"}
						/>
						<StatCard
							icon={AppIcons.Subscribed}
							iconColor={"grape"}
							label={t("SUBSCRIBED")}
							value={"-"}
						/>
						<StatCard
							icon={AppIcons.Enabled}
							iconColor={"green"}
							label={t("ENABLED")}
							value={"-"}
						/>
						<StatCard
							icon={AppIcons.Updates}
							iconColor={"orange"}
							label={t("UPDATES")}
							value={"-"}
						/>
					</Group>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("FEATURED_MODS")}
						</Text>
						{featuredMods.data?.status === StatusCodes.OK &&
							featuredMods.data.data.length === 0 && (
								<EmptyState
									withoutBorder
									title={t("NO_FEATURED_MODS_FOUND_TITLE")}
									description={t("NO_FEATURED_MODS_FOUND_SUBTITLE_DESC")}
									icon={AppIcons.Featured}
								/>
							)}
						<Group align={"stretch"}>
							{featuredMods.data?.data.map((mod) => (
								<Flex w={250} key={mod.id} flex={"auto"}>
									<ModCard
										imageUrl={mod.thumbnail}
										category={mod.category}
										averageRating={mod.averageRating}
										title={mod.name}
										summary={mod.description || ""}
										subscribers={mod.subscribersCount}
										isSubscribed={false}
										variant={"grid"}
									/>
								</Flex>
							))}
						</Group>
					</Stack>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("POPULAR_MODS")}
						</Text>
						{mods.data?.status === StatusCodes.OK &&
							mods.data.data.data.length === 0 && (
								<EmptyState
									withoutBorder
									title={t("NO_POPULAR_MODS_FOUND_TITLE")}
									description={t("NO_POPULAR_MODS_FOUND_SUBTITLE_DESC")}
									icon={AppIcons.Mods}
								/>
							)}
						{mods.data?.status === StatusCodes.OK &&
							mods.data?.data.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={mod.averageRating}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={mod.subscribersCount}
									isSubscribed={false}
									variant={breakpoint.isXs ? "grid" : "list"}
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
