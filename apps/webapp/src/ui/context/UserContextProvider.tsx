import { useGetAuthenticatedUser } from "@packages/clients/webapp";
import type { ReactNode } from "react";
import { UserContext } from "./UserContext.ts";

export function UserContextProvider({ children }: { children: ReactNode }) {
	const user = useGetAuthenticatedUser();

	function handleLogin() {
		globalThis.open("/auth/login", "_self");
	}

	function handleLogout() {
		globalThis.open("/auth/logout", "_self");
	}

	return (
		<UserContext.Provider
			value={{
				login: handleLogin,
				logout: handleLogout,
				user: user.data?.status === 200 && user.data.data ? user.data.data : null,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
