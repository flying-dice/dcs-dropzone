import { AppShell, Container, Flex, Stack, useComputedColorScheme } from "@mantine/core";
import {
	type ModData,
	type ModReleaseData,
	type UserData,
	useGetUserModReleaseById,
	useGetUserModReleases,
} from "../../_autogen/api.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { _Assets } from "./_Assets.tsx";
import { _BasicInfo } from "./_BasicInfo.tsx";
import { _Changelog } from "./_Changelog.tsx";
import { _FormActions } from "./_FormActions.tsx";
import { _MissionScripts } from "./_MissionScripts.tsx";
import { _Summary } from "./_Summary.tsx";
import { _SymbolicLinks } from "./_SymbolicLinks.tsx";
import { useUserModReleaseForm, useUserModReleaseFormSubmit } from "./form.ts";

type UserModReleasePageProps = {
	user: UserData;
	release: ModReleaseData;
	mod: ModData;
};

export function _UserModReleasePage(props: UserModReleasePageProps) {
	const colorScheme = useComputedColorScheme();
	const breakpoint = useBreakpoint();

	const releases = useGetUserModReleases(props.mod.id);
	const release = useGetUserModReleaseById(props.mod.id, props.release.id);
	const form = useUserModReleaseForm(props.mod, props.release);
	const [_, handleSubmit] = useUserModReleaseFormSubmit(props.mod, props.release, props.user, async () => {
		await release.refetch();
		await releases.refetch();
		form.resetTouched();
	});

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"} p={"md"}>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Flex gap={"md"} direction={breakpoint.isMd ? "column" : "row"}>
						<Stack flex={"auto"} gap={"lg"}>
							<_BasicInfo form={form} />
							<_Changelog form={form} />
							<_Assets form={form} />
							<_SymbolicLinks form={form} />
							<_MissionScripts form={form} />
						</Stack>
						<Stack w={breakpoint.isMd ? "100%" : 300} miw={300}>
							<_Summary form={form} />
							<_FormActions form={form} mod={props.mod} release={props.release} />
						</Stack>
					</Flex>
				</form>
			</Container>
		</AppShell.Main>
	);
}
