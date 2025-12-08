import { AspectRatio, Group, Image, Stack } from "@mantine/core";
import type { ModData } from "../../_autogen/api.ts";

export type _ScreenshotsProps = {
	mod: ModData;
};

export function _Screenshots(props: _ScreenshotsProps) {
	const mainScreenshot = props.mod.screenshots[0];
	const otherScreenshots = props.mod.screenshots.slice(1);

	return (
		<Stack>
			<AspectRatio ratio={16 / 9}>
				<Image radius={"md"} src={mainScreenshot} />
			</AspectRatio>
			<Group>
				{otherScreenshots.map((screenshot) => (
					<AspectRatio key={screenshot} ratio={16 / 9}>
						<Image h={78} radius={"md"} src={screenshot} fit={"cover"} />
					</AspectRatio>
				))}
			</Group>
		</Stack>
	);
}
