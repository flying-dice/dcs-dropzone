import { type ImageProps, Stack, useMantineTheme } from "@mantine/core";
import { useRef } from "react";

export type ModImageProps = {
	src: ImageProps["src"];
	w?: number;
	radius?: ImageProps["radius"];
};

export function ModImage({ src, w, radius }: ModImageProps) {
	const theme = useMantineTheme();
	const stackRef = useRef<HTMLDivElement>(null);

	const aspectRatio = 300 / 190;

	const parentWidth =
		stackRef.current?.parentElement?.clientWidth ||
		stackRef.current?.offsetWidth ||
		300;

	const _w = w || parentWidth || 300;
	const _h = _w / aspectRatio;

	return (
		<Stack
			ref={stackRef}
			h={_h}
			w={_w}
			miw={_w}
			mih={_h}
			maw={_w}
			mah={_h}
			style={{
				borderRadius: radius,
				backgroundColor: theme.colors.dark[5],
				backgroundImage: `url(${src})`,
				backgroundSize: "cover",
				backgroundPosition: "center center",
				width: _w,
				height: _h,
				minWidth: _w,
				minHeight: _h,
				maxWidth: _w,
				maxHeight: _h,
			}}
		/>
	);
}
