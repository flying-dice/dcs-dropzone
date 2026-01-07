import { Carousel } from "@mantine/carousel";
import { AspectRatio, Group, Image, Modal, Stack } from "@mantine/core";
import { useState } from "react";
import { useWindowSize } from "react-use";
import type { ModData } from "../../_autogen/api.ts";

export type _ScreenshotsProps = {
	mod: ModData;
};

export function _Screenshots(props: _ScreenshotsProps) {
	const mainScreenshot = props.mod.screenshots[0] || props.mod.thumbnail;
	const otherScreenshots = props.mod.screenshots.slice(1);
	const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
	const { height } = useWindowSize();

	const availableScreenshots = props.mod.screenshots.length > 0 ? props.mod.screenshots : [props.mod.thumbnail];

	return (
		<>
			<Stack>
				<AspectRatio ratio={16 / 9}>
					<Image
						src={mainScreenshot}
						onClick={() => setSelectedScreenshot(mainScreenshot)}
						style={{ cursor: "pointer" }}
					/>
				</AspectRatio>
				<Group>
					{otherScreenshots.map((screenshot) => (
						<AspectRatio key={screenshot} ratio={16 / 9}>
							<Image
								h={78}
								radius={"md"}
								src={screenshot}
								fit={"cover"}
								onClick={() => setSelectedScreenshot(screenshot)}
								style={{ cursor: "pointer" }}
							/>
						</AspectRatio>
					))}
				</Group>
			</Stack>
			<Modal
				size={height * 0.8 * (16 / 9)}
				withCloseButton={false}
				centered
				opened={!!selectedScreenshot}
				onClose={() => setSelectedScreenshot(null)}
			>
				<Carousel
					controlSize={50}
					withIndicators
					initialSlide={selectedScreenshot ? availableScreenshots.indexOf(selectedScreenshot) : undefined}
				>
					{availableScreenshots.map((screenshot) => (
						<Carousel.Slide key={screenshot}>
							<Image radius={"md"} src={screenshot} />
						</Carousel.Slide>
					))}
				</Carousel>
			</Modal>
		</>
	);
}
