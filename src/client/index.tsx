import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { App } from "./App";
import { UserContextProvider } from "./context/UserContextProvider.tsx";
import { theme } from "./theme.ts";

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
const elem = document.getElementById("root")!;
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

if (import.meta.hot) {
	// With hot module reloading, `import.meta.hot.data` is persisted.
	const root = (import.meta.hot.data.root ??= createRoot(elem));
	root.render(app);
} else {
	// The hot module reloading API is not available in production.
	createRoot(elem).render(app);
}
