import {
	Avatar,
	Button,
	Group,
	Menu,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { BiDetail, BiLogOut, BiLogoGithub, BiPackage } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext.ts";

export function ProfileMenu() {
	const { t } = useTranslation();
	const nav = useNavigate();
	const { user, logout, login } = useUserContext();

	function viewUserDetails() {
		if (!user) return;
		openModal({
			size: "lg",
			title: (
				<Group>
					<Avatar src={user.avatarUrl} />
					<Text>{user.username}</Text>
				</Group>
			),
			children: (
				<Stack>
					<TextInput
						readOnly
						label={t("USER_ID")}
						value={user.id}
						description={t("USER_ID_DESCRIPTION")}
					/>
					<TextInput
						readOnly
						label={t("USER_LOGIN")}
						value={user.username}
						description={t("USER_LOGIN_DESCRIPTION")}
					/>
					<TextInput
						readOnly
						label={t("USER_NAME")}
						value={user.name}
						description={t("USER_NAME_DESCRIPTION")}
					/>
					<TextInput
						readOnly
						label={t("USER_PROFILE_URL")}
						value={user.profileUrl}
						description={t("USER_PROFILE_URL_DESCRIPTION")}
					/>
				</Stack>
			),
		});
	}

	return (
		<Stack pr="md">
			{!user && (
				<Button variant="default" onClick={login}>
					{t("LOGIN")}
				</Button>
			)}
			{user && (
				<Menu>
					<Menu.Target>
						<Avatar src={user.avatarUrl} style={{ cursor: "pointer" }} />
					</Menu.Target>
					<Menu.Dropdown>
						<Stack gap={0} p="xs">
							<Text size="sm" fw="bold">
								{user.username}
							</Text>
							<Text size="sm" c="dimmed">
								{user.name}
							</Text>
						</Stack>

						{user && (
							<Menu.Item
								onClick={() => nav("/user-mods")}
								leftSection={<BiPackage />}
							>
								{t("USER_MODS")}
							</Menu.Item>
						)}

						<Menu.Divider />

						<Menu.Item onClick={viewUserDetails} leftSection={<BiDetail />}>
							{t("VIEW_USER_DETAILS")}
						</Menu.Item>
						<Menu.Item
							onClick={() => globalThis.open(user.profileUrl, "_blank")}
							leftSection={<BiLogoGithub />}
						>
							{t("VIEW_PROFILE")}
						</Menu.Item>
						<Menu.Item onClick={logout} leftSection={<BiLogOut />}>
							{t("LOGOUT")}
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			)}
		</Stack>
	);
}
