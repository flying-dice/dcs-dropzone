import { AppShell, type AppShellProps, Burger, Button, Group, Image, Stack } from "@mantine/core";
import type { UseDisclosureReturnValue } from "@mantine/hooks";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { match } from "ts-pattern";
import icon from "./assets/icon.svg";
import logo from "./assets/logo.svg";
import { AppIcons } from "./icons.ts";
import { useAppTranslation } from "./useAppTranslation.ts";
import { useBreakpoint } from "./useBreakpoint.ts";

type ActionMenuItemProps = {
	id: string;
	label: string;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	icon: IconType;
};

function ActionMenuButtonItem(props: ActionMenuItemProps) {
	return (
		<Button
			leftSection={<props.icon />}
			variant={props.active ? "light" : "transparent"}
			disabled={props.disabled}
			onClick={props.onClick}
			styles={props.active ? { label: { textDecoration: "underline" } } : undefined}
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
		>
			{props.label}
		</Button>
	);
}

export type DzAppShellProps = Omit<AppShellProps, "header" | "footer"> & {
	variant: "webapp" | "daemon";
	webappUrl?: string | null;
	webviewUrl?: string | null;
	headerSection?: ReactNode;
	navbarDisclosure?: UseDisclosureReturnValue;
};
export function DzAppShell(props: DzAppShellProps) {
	const { isSm, isXs } = useBreakpoint();
	const { t } = useAppTranslation();
	const variant: "footer" | "button" = isSm ? "footer" : "button";

	const actions: ActionMenuItemProps[] = [
		{
			id: "store",
			label: t("STORE"),
			active: props.variant === "webapp",
			disabled: !props.webappUrl,
			icon: AppIcons.Store,
			onClick: () => {
				if (props.webappUrl) {
					window.open(props.webappUrl, "_self");
				}
			},
		},
		{
			id: "library",
			label: t("LIBRARY"),
			active: props.variant === "daemon",
			disabled: !props.webviewUrl,
			icon: AppIcons.Library,
			onClick: () => {
				if (props.webviewUrl) {
					window.open(props.webviewUrl, "_self");
				}
			},
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
