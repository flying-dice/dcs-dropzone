import { Badge, type MantineColor, NavLink, Text } from "@mantine/core";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { match } from "ts-pattern";

export type BaseDzNavLinkProps = {
	icon: IconType;
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
};

export type DzNavLinkWithRightSectionProps = BaseDzNavLinkProps & { rightSection: ReactNode };
export type DzNavLinkWithCountProps = BaseDzNavLinkProps & { count: number; countColor?: MantineColor };
export type DzNavLinkProps = BaseDzNavLinkProps | DzNavLinkWithRightSectionProps | DzNavLinkWithCountProps;

function isDzNavLinkWithRightSectionProps(props: DzNavLinkProps): props is DzNavLinkWithRightSectionProps {
	return "rightSection" in props;
}

function isDzNavLinkWithCountProps(props: DzNavLinkProps): props is DzNavLinkWithCountProps {
	return "count" in props;
}

export function DzNavLink(props: DzNavLinkProps) {
	const rightSection = match(props)
		.when(isDzNavLinkWithRightSectionProps, (_props) => _props.rightSection)
		.when(isDzNavLinkWithCountProps, (_props) => <Badge color={_props.countColor}>{_props.count}</Badge>)
		.otherwise(() => undefined);

	return (
		<NavLink
			active={props.active}
			disabled={props.disabled}
			styles={{ root: { borderRadius: "0.5rem" } }}
			leftSection={<props.icon />}
			rightSection={rightSection}
			label={
				<Text fz={14} fw={"normal"}>
					{props.label}
				</Text>
			}
			onClick={props.onClick}
		/>
	);
}
