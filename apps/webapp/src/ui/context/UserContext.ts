import type { UserData } from "@packages/clients/webapp";
import { createContext, useContext } from "react";

export const UserContext = createContext<{
	login: () => void;
	logout: () => void;
	user: UserData | null;
}>({
	login: () => {},
	logout: () => {},
	user: null,
});

export const useUserContext = () => useContext(UserContext);
