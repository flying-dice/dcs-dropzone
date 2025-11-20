import { type ImageProps, Stack, useMantineTheme } from "@mantine/core";
import { useRef } from "react";

export type ModImageProps = {
	src: ImageProps["src"];
	w?: number;
	radius?: ImageProps["radius"];
	pt?: ImageProps["pt"];
	pb?: ImageProps["pb"];
	pl?: ImageProps["pl"];
	pr?: ImageProps["pr"];
	px?: ImageProps["px"];
	py?: ImageProps["py"];
};

export function ModImage(props: ModImageProps) {
	const theme = useMantineTheme();
	const stackRef = useRef<HTMLDivElement>(null);

	const aspectRatio = 300 / 190;

	const parentWidth =
		stackRef.current?.parentElement?.clientWidth ||
		stackRef.current?.offsetWidth ||
		300;

	const _w = props.w || parentWidth || 300;
	const _h = _w / aspectRatio;

	const _borderRadius = props.radius
		? typeof props.radius === "number"
			? props.radius
			: theme.radius[props.radius]
		: undefined;

	return (
		<Stack
			pt={props.pt}
			pb={props.pb}
			pl={props.pl}
			pr={props.pr}
			px={props.px}
			py={props.py}
			ref={stackRef}
			h={_h}
			w={_w}
			miw={_w}
			mih={_h}
			maw={_w}
			mah={_h}
			style={{
				borderRadius: _borderRadius,
				backgroundColor: theme.colors.dark[5],
				backgroundImage: `url(${props.src})`,
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
