import {AppShell, Button, Divider, Group, Stack, Text} from "@mantine/core";
import {BsDownload} from "react-icons/bs";
// import doctorGlitch from "../assets/Doctor Glitch.otf";
// import montserrat from "../assets/Montserrat-VariableFont_wght.ttf"
import {useNavigate} from "react-router-dom";
import {ProfileMenu} from "./ProfileMenu.tsx";

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <AppShell.Header>
      <Stack pl="md" h="100%" justify="center">
        <Group justify="space-between">
          <Group>
            <Text
              style={{
                fontSize: "xx-large",
                // fontFamily: doctorGlitch,
                color: "#f59e0f",
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              Dropzone
            </Text>
            <Divider orientation="vertical" />
            <Text
              style={{
                // fontFamily: montserrat,
                width: 250,
              }}
            >
              Community Mod Manager for DCS World
            </Text>
          </Group>
          <Stack gap={2} pr="md">
            <Group>
              <Button
                rightSection={<BsDownload />}
                color="#f59e0f"
                onClick={() =>
                  globalThis.open(
                    "https://github.com/flying-dice/dcs-dropzone-mod-manager/releases",
                  )}
              >
                Get it on Github
              </Button>
              <ProfileMenu />
            </Group>
          </Stack>
        </Group>
      </Stack>
    </AppShell.Header>
  );
}
