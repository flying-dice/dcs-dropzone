import { StatusCodes } from "http-status-codes";
import { useParams } from "react-router-dom";
import {
	type UserData,
	useGetUserModById,
	useGetUserModReleaseById,
} from "../../_autogen/api.ts";
import { _UserModReleasePage } from "./page.tsx";

export function UserModReleasePage(props: { user: UserData }) {
	const params = useParams<{ modId: string; releaseId: string }>();
	const release = useGetUserModReleaseById(params.modId!, params.releaseId!);
	const mod = useGetUserModById(params.modId!);

	if (release.isLoading || mod.isLoading) {
		return <div>Loading...</div>;
	}

	if (mod.isError || mod.data?.status !== StatusCodes.OK) {
		return <div>Error loading mod.</div>;
	}

	if (release.isError || release.data?.status !== StatusCodes.OK) {
		return <div>Error loading release.</div>;
	}

	return (
		<_UserModReleasePage
			user={props.user}
			release={release.data.data}
			mod={mod.data.data}
		/>
	);
}
