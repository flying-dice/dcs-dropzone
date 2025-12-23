import {
	AppShell,
	Badge,
	Box,
	Card,
	Container,
	Divider,
	Flex,
	Grid,
	GridCol,
	Group,
	Stack,
	Tabs,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import {
	type ModData,
	type ModReleaseData,
	ModReleaseMissionScriptDataRunOn,
	type UserData,
} from "../../_autogen/api.ts";
import { MaintainersAvatars } from "../../components/MaintainersAvatars.tsx";
import { Markdown } from "../../components/Markdown.tsx";
import { ModReleaseDaemonControls } from "../../components/ModReleaseDaemonControls.tsx";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _BasicInfo } from "./_BasicInfo.tsx";
import { _Installation } from "./_Installation.tsx";
import { _Maintainers } from "./_Maintainers.tsx";
import { _Releases } from "./_Releases.tsx";
import { _Screenshots } from "./_Screenshots.tsx";

type _PageProps = {
	mod: ModData;
	maintainers: UserData[];
	release?: ModReleaseData;
};

export function _Page(props: _PageProps) {
	const colorScheme = useComputedColorScheme();
	const { isSm, isMd } = useBreakpoint();
	const { t } = useAppTranslation();

	const countScriptsBeforeSanitize = props.release?.missionScripts.filter(
		(it) => it.runOn === ModReleaseMissionScriptDataRunOn.MISSION_START_BEFORE_SANITIZE,
	).length;

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Stack bg={colorScheme === "light" ? "white" : "dark.7"}>
				<Container size={"xl"} pt={"md"}>
					<Grid>
						<GridCol span={isSm || isMd ? 12 : 8}>
							<_Screenshots mod={props.mod} />
						</GridCol>
						<GridCol span={isSm || isMd ? 12 : 4}>
							<Stack>
								<_BasicInfo mod={props.mod} maintainers={props.maintainers} latestRelease={props.release} />
								{props.release && <ModReleaseDaemonControls mod={props.mod} release={props.release} />}
							</Stack>
						</GridCol>
					</Grid>
				</Container>
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
							<Tabs.Tab py={"md"} value="changelog" disabled={!props.release}>
								{t("CHANGELOG")}
							</Tabs.Tab>
							<Tabs.Tab
								py={"md"}
								value="installation"
								disabled={!props.release}
								rightSection={
									countScriptsBeforeSanitize ? <Badge color={"orange"}>{countScriptsBeforeSanitize}</Badge> : undefined
								}
							>
								{t("INSTALLATION")}
							</Tabs.Tab>
						</Tabs.List>
					</Container>
				</Flex>
				<Divider />
				<Container size={"xl"} p={"md"}>
					<Tabs.Panel value="description">
						<Flex direction={isSm ? "column-reverse" : isMd ? "column-reverse" : "row"} gap={"md"}>
							<Card radius={"md"} withBorder>
								<Stack>
									<Text fw={"bold"}>{t("DESCRIPTION")}</Text>
									<Markdown content={props.mod.content} />
								</Stack>
							</Card>
							<Box miw={isSm ? "100%" : isMd ? "100%" : 300} w={isSm ? "100%" : isMd ? "100%" : 300}>
								<Stack>
									<Card radius={"md"} withBorder>
										<Stack>
											<Text fw={"bold"}>{t("AUTHORS")}</Text>
											<_Maintainers maintainers={props.maintainers} />
										</Stack>
									</Card>
									<Card radius={"md"} withBorder>
										<Stack>
											<Text fw={"bold"}>{t("RELEASES")}</Text>
											<_Releases mod={props.mod} activeRelease={props.release} />
										</Stack>
									</Card>
								</Stack>
							</Box>
						</Flex>
					</Tabs.Panel>
					<Tabs.Panel value="changelog">
						<Card radius={"md"} withBorder>
							<Stack>
								<Text fw={"bold"}>{t("CHANGELOG")}</Text>
								<Markdown content={props.release?.changelog || ""} />
							</Stack>
						</Card>
					</Tabs.Panel>
					<Tabs.Panel value="installation">
						{props.release && (
							<_Installation
								mod={props.mod}
								latestRelease={props.release}
								countScriptsBeforeSanitize={countScriptsBeforeSanitize}
							/>
						)}
					</Tabs.Panel>
				</Container>
			</Tabs>
		</AppShell.Main>
	);
}
