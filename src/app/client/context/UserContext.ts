import { createContext, useContext } from "react";
import type { AuthenticatedUser } from "../_autogen/api.ts";

export const UserContext = createContext<{
	login: () => void;
	logout: () => void;
	user: AuthenticatedUser | null;
}>({
	login: () => {},
	logout: () => {},
	user: null,
});

export const useUserContext = () => useContext(UserContext);
