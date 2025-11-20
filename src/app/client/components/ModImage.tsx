import {
	AspectRatio,
	type AspectRatioProps,
	Image,
	type ImageProps,
} from "@mantine/core";

export type ModImageProps = {
	src: string;
	radius?: ImageProps["radius"];
	w?: ImageProps["w"];
	h?: ImageProps["h"];

	props?: {
		image?: ImageProps;
		aspectRatio?: AspectRatioProps;
	};
};

const aspectRatio = 300 / 190;

export function ModImage(props: ModImageProps) {
	return (
		<AspectRatio
			{...props.props?.aspectRatio}
			ratio={aspectRatio}
			w={props.w}
			h={props.h}
			flex={"auto"}
		>
			<Image {...props.props?.image} src={props.src} radius={props.radius} />
		</AspectRatio>
	);
}
