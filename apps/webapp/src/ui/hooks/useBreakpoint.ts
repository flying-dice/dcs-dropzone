import { em, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

export type Breakpoints = {
	/**
	 * Width typically less than 576px
	 * I.e. Mobile devices
	 */
	isXs: boolean;

	/**
	 * Width typically 576px upto 768px
	 * I.e. Small tablets and large mobile devices
	 */
	isSm: boolean;

	/**
	 * Width typically 768px upto 992px
	 * I.e. Tablets
	 */
	isMd: boolean;

	/**
	 * Width typically 992px upto 1200px
	 * I.e. Small laptops and large tablets
	 */
	isLg: boolean;

	/**
	 * Width typically greater than 1200px
	 * I.e. Desktops and large laptops
	 */
	isXl: boolean;
};

/**
 * https://mantine.dev/styles/responsive/#configure-breakpoints
 */
export function useBreakpoint(): Breakpoints {
	const theme = useMantineTheme();
	const isXs = useMediaQuery(`(max-width: ${em(theme.breakpoints.xs)})`);
	const isSm = useMediaQuery(`(max-width: ${em(theme.breakpoints.sm)})`);
	const isMd = useMediaQuery(`(max-width: ${em(theme.breakpoints.md)})`);
	const isLg = useMediaQuery(`(max-width: ${em(theme.breakpoints.lg)})`);
	const isXl = useMediaQuery(`(max-width: ${em(theme.breakpoints.xl)})`);

	return { isXs, isSm, isMd, isLg, isXl };
}
