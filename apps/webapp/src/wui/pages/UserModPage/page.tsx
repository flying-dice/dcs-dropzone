import { AppShell, Container, Flex, Stack, useComputedColorScheme } from "@mantine/core";
import { type ModData, type UserData, useGetUserModById, useGetUserMods } from "../../_autogen/api.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { _BasicInfo } from "./_BasicInfo.tsx";
import { _Dependencies } from "./_Dependencies.tsx";
import { _Description } from "./_Description.tsx";
import { _FormActions } from "./_FormActions.tsx";
import { _Releases } from "./_Releases.tsx";
import { _Screenshots } from "./_Screenshots.tsx";
import { _Tags } from "./_Tags.tsx";
import { _Thumbnail } from "./_Thumbnail.tsx";
import { _UserModMetrics } from "./_UserModMetrics.tsx";
import { _VisibilityAndPermissions } from "./_VisibilityAndPermissions.tsx";
import { useUserModForm, useUserModFormSubmit } from "./form.ts";

type UserModPageProps = {
	user: UserData;
	mod: ModData;
};

export function _UserModPage(props: UserModPageProps) {
	const userMods = useGetUserMods();
	const mod = useGetUserModById(props.mod.id);
	const breakpoint = useBreakpoint();

	const colorScheme = useComputedColorScheme();

	const form = useUserModForm(props.mod);
	const [_, handleSubmit] = useUserModFormSubmit(props.mod, props.user, async () => {
		await mod.refetch();
		await userMods.refetch();
		form.resetTouched();
	});

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"} p={"md"}>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Flex gap={"md"} direction={breakpoint.isMd ? "column" : "row"}>
						<Stack flex={"auto"} gap={"lg"}>
							<_BasicInfo form={form} />
							<_Description form={form} />
							<_Tags form={form} />
							<_Dependencies form={form} />
							<_Releases form={form} mod={props.mod} />
						</Stack>
						<Stack w={breakpoint.isMd ? "100%" : 300} miw={300}>
							<_Thumbnail form={form} />
							<_VisibilityAndPermissions form={form} />
							<_UserModMetrics downloads={mod.data?.status === 200 ? mod.data.data.downloadsCount : 0} />
							<_Screenshots form={form} />
							<_FormActions form={form} mod={props.mod} />
						</Stack>
					</Flex>
				</form>
			</Container>
		</AppShell.Main>
	);
}
