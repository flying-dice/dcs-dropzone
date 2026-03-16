import { _UserModsPage, type UserModsPageProps } from "./page.tsx";

export function UserModsPage(props: UserModsPageProps) {
	return <_UserModsPage user={props.user} />;
}

export type { UserModsPageProps };
