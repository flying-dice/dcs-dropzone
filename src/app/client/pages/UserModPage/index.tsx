import { StatusCodes } from "http-status-codes";
import { useParams } from "react-router-dom";
import { type UserData, useGetUserModById } from "../../_autogen/api.ts";
import { _UserModPage } from "./page.tsx";

export function UserModPage(props: { user: UserData }) {
	const params = useParams<{ modId: string }>();
	const mod = useGetUserModById(params.modId || "undefined");

	if (mod.isLoading) {
		return <div>Loading...</div>;
	}

	if (mod.isError || !mod.data) {
		return <div>Error loading mod.</div>;
	}

	if (mod.data.status !== StatusCodes.OK) {
		return <div>Error: {mod.status}</div>;
	}

	return <_UserModPage user={props.user} mod={mod.data.data} />;
}
