import {
	AppShell,
	Container,
	Group,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ModCategory } from "../../../common/data.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard";
import { StatCard } from "../components/StatCard.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useDaemonSubscriptions } from "../hooks/useDaemonSubscriber.ts";
import { AppIcons } from "../icons.ts";

export function SubscribedPage() {
	const { t } = useTranslation();
	const colorScheme = useComputedColorScheme();
	const breakpoint = useBreakpoint();

	const { enabledCount, count, scubscriptions } = useDaemonSubscriptions();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<Group>
						<StatCard
							icon={AppIcons.Subscribed}
							iconColor={"grape"}
							label={t("SUBSCRIBED")}
							value={count}
						/>
						<StatCard
							icon={AppIcons.Enabled}
							iconColor={"green"}
							label={t("ENABLED")}
							value={enabledCount}
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
							{t("SUBSCRIBED")}
						</Text>
						{scubscriptions && scubscriptions.length === 0 && (
							<EmptyState
								withoutBorder
								title={t("NO_MODS_FOUND_TITLE")}
								description={t("NO_MODS_FOUND_SUBTITLE_DESC")}
								icon={AppIcons.Mods}
							/>
						)}
						{scubscriptions?.map((mod) => (
							<ModCard
								key={mod.modId}
								imageUrl={""}
								category={ModCategory.OTHER}
								averageRating={0}
								title={mod.modName}
								summary={""}
								subscribers={0}
								isSubscribed={true}
								variant={breakpoint.isXs ? "grid" : "list"}
							/>
						))}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}
