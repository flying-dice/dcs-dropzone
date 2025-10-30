import { generateColors } from "@mantine/colors-generator";
import { createTheme } from "@mantine/core";

export const theme = createTheme({
	autoContrast: true,
	colors: {
		dcsyellow: generateColors("#FDB11C"),
	},
});
