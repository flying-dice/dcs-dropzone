import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "@packages/dzui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchInterval: false,
			refetchIntervalInBackground: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			retry: false,
		},
	},
});

const elem = document.getElementById("root");
if (!elem) {
	throw new Error("Root element not found");
}

const app = (
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme}>
				<ModalsProvider>
					<Notifications />
					<App />
				</ModalsProvider>
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>
);

/**
 * If HMR is not enabled, the build will be rendered using the cached root instance.
 * If HMR is enabled, but the root instance is not cached, it will be created and cached.
 * If HMR is enabled and the root instance is cached, it will be reused.
 *
 * @param elem {HTMLElement} The root element to render the build into.
 * @returns {ReturnType<typeof createRoot>} The root instance.
 */
function getCachedRootOrCreate(elem: HTMLElement): ReturnType<typeof createRoot> {
	if (!import.meta.hot) return createRoot(elem);

	if (import.meta.hot && !import.meta.hot.data.root) {
		const root = createRoot(elem);
		import.meta.hot.data.root = root;
		return root;
	}

	return import.meta.hot.data.root;
}

const root = getCachedRootOrCreate(elem);
root.render(app);
