// https://vitepress.dev/guide/custom-theme

import { type Theme, useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h, nextTick, watch } from "vue";
import "./style.css";
import { createMermaidRenderer } from "vitepress-mermaid-renderer";

export default {
	extends: DefaultTheme,
	Layout: () => {
		const { isDark } = useData();

		const renderMermaid = () => {
			createMermaidRenderer({
				theme: isDark.value ? "dark" : "forest",
			});
		};

		nextTick(renderMermaid);
		watch(() => isDark.value, renderMermaid);

		return h(DefaultTheme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
		});
	},
	enhanceApp({ app, router, siteData }) {
		// ...
	},
} satisfies Theme;
