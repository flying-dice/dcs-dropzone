import {
  Avatar,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  BiData,
  BiDetail,
  BiLogoGithub,
  BiLogOut,
  BiPackage,
} from "react-icons/bi";
import { openModal } from "@mantine/modals";
import { useUserContext } from "../context/UserContext.ts";
import { useNavigate } from "react-router-dom";

export function ProfileMenu() {
  const nav = useNavigate();
  const { user, logout, login } = useUserContext();

  function viewUserDetails() {
    if (!user) return;
    openModal({
      size: "lg",
      title: (
        <Group>
          <Avatar src={user.avatarUrl} />
          <Text>{user.login}</Text>
        </Group>
      ),
      children: (
        <Stack>
          <TextInput
            readOnly
            label="User ID"
            value={user.id}
            description="This is your User ID, all mods you publish will be bound to this ID"
          />
          <TextInput
            readOnly
            label="User Login"
            value={user.login}
            description="This is your User Login"
          />
          <TextInput
            readOnly
            label="User Name"
            value={user.name}
            description="This is your User Name"
          />
          <TextInput
            readOnly
            label="User Profile URL"
            value={user.profileUrl}
            description="This is your User Profile URL"
          />
        </Stack>
      ),
    });
  }

  return (
    <Stack pr="md">
      {!user && (
        <Button
            color={"gray"}
          variant="subtle"
          onClick={login}
        >
          Login
        </Button>
      )}
      {user && (
        <Menu>
          <Menu.Target>
            <Avatar
              src={user.avatarUrl}
              style={{ cursor: "pointer" }}
            />
          </Menu.Target>
          <Menu.Dropdown>
            <Stack gap={0} p="xs">
              <Text size="sm" fw="bold">
                {user.login}
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
                User Mods
              </Menu.Item>
            )}

            {user.sudo && (
              <Menu.Item
                onClick={() => nav("/sudo-mods")}
                leftSection={<BiData />}
              >
                Sudo Mods
              </Menu.Item>
            )}

            <Menu.Divider />

            <Menu.Item onClick={viewUserDetails} leftSection={<BiDetail />}>
              View User Details
            </Menu.Item>
            <Menu.Item
              onClick={() => globalThis.open(user.profileUrl, "_blank")}
              leftSection={<BiLogoGithub />}
            >
              View Profile
            </Menu.Item>
            <Menu.Item onClick={logout} leftSection={<BiLogOut />}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </Stack>
  );
}
