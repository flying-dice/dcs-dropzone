import { createContext, useContext } from "react";
import type { UserData } from "../_autogen/api.ts";

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
