import {
	AppShell,
	Card,
	Container,
	Divider,
	Flex,
	Grid,
	GridCol,
	Group,
	SimpleGrid,
	Stack,
	Tabs,
	TabsPanel,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import type { ModData, ModReleaseData } from "../../_autogen/api.ts";
import { Markdown } from "../../components/Markdown.tsx";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _BasicInfo } from "./_BasicInfo.tsx";
import { _Releases } from "./_Releases.tsx";
import { _Screenshots } from "./_Screenshots.tsx";

type _PageProps = {
	mod: ModData;
	latestRelease?: ModReleaseData;
};

function _Page(props: _PageProps) {
	const colorScheme = useComputedColorScheme();
	const { isSm, isMd } = useBreakpoint();
	const { t } = useAppTranslation();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Stack bg={colorScheme === "light" ? "white" : "dark.7"}>
				<Grid p={"xl"}>
					<GridCol span={isSm || isMd ? 12 : 8}>
						<_Screenshots mod={props.mod} />
					</GridCol>
					<GridCol span={isSm || isMd ? 12 : 4}>
						<_BasicInfo mod={props.mod} latestRelease={props.latestRelease} />
					</GridCol>
				</Grid>
				<Divider />
			</Stack>
			<Tabs
				defaultValue="description"
				styles={{
					list: {
						"--tabs-list-line-bottom": "none",
						"--tabs-list-line-top": "none",
						"--tabs-list-line-start": "none",
						"--tabs-list-line-end": "none",
					},
				}}
			>
				<Flex bg={colorScheme === "light" ? "white" : "dark.7"}>
					<Container flex={"auto"} size={"xl"}>
						<Tabs.List>
							<Tabs.Tab py={"md"} value="description">
								{t("DESCRIPTION")}
							</Tabs.Tab>
							<Tabs.Tab py={"md"} value="releases">
								{t("RELEASES")}
							</Tabs.Tab>
						</Tabs.List>
					</Container>
				</Flex>
				<Divider />
				<Container size={"xl"} p={"md"}>
					<Tabs.Panel value="description">
						<Card radius={"md"} withBorder m={"md"}>
							<Stack>
								<Text fw={"bold"}>{t("DESCRIPTION")}</Text>
								<Markdown content={props.mod.content} />
							</Stack>
						</Card>
					</Tabs.Panel>
					<Tabs.Panel value="releases">
						<_Releases mod={props.mod} />
					</Tabs.Panel>
				</Container>
			</Tabs>
		</AppShell.Main>
	);
}

export default _Page;
