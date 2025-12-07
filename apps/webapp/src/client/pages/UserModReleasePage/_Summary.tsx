import { Card, Stack, Text } from "@mantine/core";
import { FaFileDownload } from "react-icons/fa";
import { FaTag } from "react-icons/fa6";
import { Stat } from "../../components/Stat.tsx";
import { VisibilityIcons } from "../../icons.ts";
import type { UserModReleaseForm } from "./form.ts";

export function _Summary(props: { form: UserModReleaseForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Summary
				</Text>
				<Stat icon={FaTag} stat={props.form.values.version} />
				<Stat icon={FaFileDownload} stat={props.form.values.assets.length} />
				<Stat icon={VisibilityIcons[props.form.values.visibility]} stat={props.form.values.visibility} />
			</Stack>
		</Card>
	);
}
