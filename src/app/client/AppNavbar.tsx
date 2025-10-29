import { AppShell, Stack, Text } from "@mantine/core";
import { CategoryShortcut } from "./components/CategoryShortcut.tsx";
import { NavShortcut } from "./components/NavShortcut.tsx";
import { AppIcons } from "./icons.ts";

export function AppNavbar() {
	return (
		<AppShell.Navbar>
			<Stack p={"md"} gap={"xl"}>
				<Stack gap={"xs"}>
					<NavShortcut icon={AppIcons.Home} label={"Dashboard"} to={"/"} />
					<NavShortcut
						icon={AppIcons.Mods}
						label={"Browse Mods"}
						to={"/mods"}
					/>
					<NavShortcut
						icon={AppIcons.Subscribed}
						label={"Subscribed"}
						count={42}
					/>
					<NavShortcut
						icon={AppIcons.Enabled}
						label={"Enabled"}
						count={12}
						countColor={"green"}
					/>

					<NavShortcut
						icon={AppIcons.Updates}
						label={"Updates"}
						count={3}
						countColor={"red"}
					/>
				</Stack>
				<Stack gap="0">
					<Text fw={"bold"} fz={12} c={"gray"} pb={"sm"}>
						CATEGORIES
					</Text>
					<CategoryShortcut label={"Aircraft"} count={156} />
					<CategoryShortcut label={"Maps"} count={43} />
					<CategoryShortcut label={"Weapons"} count={89} />
				</Stack>
			</Stack>
		</AppShell.Navbar>
	);
}
