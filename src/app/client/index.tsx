import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { UserContextProvider } from "./context/UserContextProvider.tsx";
import { theme } from "./theme.ts";

import "./i18n/index.ts";

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
			<UserContextProvider>
				<MantineProvider theme={theme}>
					<ModalsProvider>
						<Notifications />
						<App />
					</ModalsProvider>
				</MantineProvider>
			</UserContextProvider>
		</QueryClientProvider>
	</StrictMode>
);

/**
 * If HMR is not enabled, the app will be rendered using the cached root instance.
 * If HMR is enabled, but the root instance is not cached, it will be created and cached.
 * If HMR is enabled and the root instance is cached, it will be reused.
 *
 * @param elem {HTMLElement} The root element to render the app into.
 * @returns {ReturnType<typeof createRoot>} The root instance.
 */
function getCachedRootOrCreate(elem: HTMLElement): ReturnType<typeof createRoot> {
	if (!import.meta.hot) return createRoot(elem);

	if (import.meta.hot && !import.meta.hot.data.root) {
		import.meta.hot.data.root = createRoot(elem);
	}

	return import.meta.hot.data.root;
}

const root = getCachedRootOrCreate(elem);
root.render(app);
