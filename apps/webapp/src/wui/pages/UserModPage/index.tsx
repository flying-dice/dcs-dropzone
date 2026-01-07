import { StatusCodes } from "http-status-codes";
import { useParams } from "react-router-dom";
import { type UserData, useGetUserModById } from "../../_autogen/api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _UserModPage } from "./page.tsx";

export function UserModPage(props: { user: UserData }) {
	const { t } = useAppTranslation();
	const params = useParams<{ modId: string }>();
	const mod = useGetUserModById(params.modId || "undefined");

	if (mod.isLoading) {
		return <div>{t("LOADING")}</div>;
	}

	if (mod.isError || !mod.data) {
		return <div>{t("ERROR_LOADING_MOD")}</div>;
	}

	if (mod.data.status !== StatusCodes.OK) {
		return <div>{t("ERROR_STATUS", { status: mod.status })}</div>;
	}

	return <_UserModPage user={props.user} mod={mod.data.data} />;
}
