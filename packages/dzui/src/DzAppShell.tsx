import { AppShell, type AppShellProps, Burger, Button, Group, Image, Stack } from "@mantine/core";
import type { UseDisclosureReturnValue } from "@mantine/hooks";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { useAsyncFn } from "react-use";
import { match } from "ts-pattern";
import icon from "./assets/icon.svg";
import logo from "./assets/logo.svg";
import { constants } from "./constants.ts";
import { AppIcons } from "./icons.ts";
import { showErrorNotification } from "./showErrorNotification.tsx";
import { useAppTranslation } from "./useAppTranslation.ts";
import { useBreakpoint } from "./useBreakpoint.ts";

type ActionMenuItemProps = {
	id: string;
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	icon: IconType;
	loading?: boolean;
};

function ActionMenuButtonItem(props: ActionMenuItemProps) {
	return (
		<Button
			leftSection={<props.icon />}
			variant={props.active ? "light" : "transparent"}
			disabled={props.disabled}
			onClick={props.onClick}
			styles={props.active ? { label: { textDecoration: "underline" } } : undefined}
			loading={props.loading}
		>
			{props.label}
		</Button>
	);
}

function ActionMenuFooterItem(props: ActionMenuItemProps) {
	return (
		<Button
			h={"100%"}
			radius={0}
			leftSection={<props.icon />}
			variant={props.active ? "light" : "transparent"}
			disabled={props.disabled}
			onClick={props.onClick}
			styles={props.active ? { label: { textDecoration: "underline" } } : undefined}
			loading={props.loading}
		>
			{props.label}
		</Button>
	);
}

export type DzAppShellProps = Omit<AppShellProps, "header" | "footer"> & {
	variant: "webapp" | "daemon";
	headerSection?: ReactNode;
	navbarDisclosure?: UseDisclosureReturnValue;
};
export function DzAppShell(props: DzAppShellProps) {
	const { isSm, isXs } = useBreakpoint();
	const { t } = useAppTranslation();
	const variant: "footer" | "button" = isSm ? "footer" : "button";

	const [webappOpening, openWebapp] = useAsyncFn(async () => {
		try {
			await fetch(new URL("/api/health", constants.WEBAPP_URL));
			window.open(constants.WEBAPP_URL, "_self");
		} catch (e) {
			showErrorNotification(e);
		}
	}, []);
	const [daemonOpening, openDaemon] = useAsyncFn(async () => {
		try {
			await fetch(new URL("/api/health", constants.DAEMON_URL));
			window.open(constants.DAEMON_URL, "_self");
		} catch (e) {
			showErrorNotification(e);
		}
	}, []);

	const actions: ActionMenuItemProps[] = [
		{
			id: "webapp",
			label: t("DISCOVER"),
			active: props.variant === "webapp",
			icon: AppIcons.Store,
			onClick: openWebapp,
			loading: webappOpening.loading,
			disabled: !!webappOpening.error,
		},
		{
			id: "daemon",
			label: t("LIBRARY"),
			active: props.variant === "daemon",
			icon: AppIcons.Library,
			onClick: openDaemon,
			loading: daemonOpening.loading,
			disabled: !!daemonOpening.error,
		},
	];

	const actionMenu = actions.map((action) =>
		match(variant)
			.when(
				(it) => it === "button",
				() => <ActionMenuButtonItem {...action} key={action.id} />,
			)
			.when(
				(it) => it === "footer",
				() => <ActionMenuFooterItem {...action} key={action.id} />,
			)
			.otherwise(() => null),
	);

	return (
		<AppShell header={{ height: 80 }} footer={variant === "footer" ? { height: 40 } : undefined} {...props}>
			<AppShell.Header>
				<Stack pl="md" h="100%" justify="center">
					<Group justify="space-between">
						<Group gap={"xs"}>
							{props.navbarDisclosure && (
								<Burger opened={props.navbarDisclosure[0]} onClick={props.navbarDisclosure[1].toggle} hiddenFrom="xs" />
							)}
							<Image w={"min-content"} h={44} src={isXs ? icon : logo} />
							{variant !== "footer" && <Group gap={"xs"}>{actionMenu}</Group>}
						</Group>

						<Stack gap={2} pr="md">
							{props.headerSection}
						</Stack>
					</Group>
				</Stack>
			</AppShell.Header>
			{props.children}
			{variant === "footer" && (
				<AppShell.Footer display={"flex"}>
					<Group gap={0} flex={"auto"} grow>
						{actionMenu}
					</Group>
				</AppShell.Footer>
			)}
		</AppShell>
	);
}
