import { Card, Stack, Tabs, Text } from "@mantine/core";
import { Markdown } from "../../components/Markdown.tsx";
import { MarkdownEditor } from "../../components/MarkdownEditor.tsx";
import type { UserModReleaseForm } from "./form.ts";

export function _Changelog(props: { form: UserModReleaseForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Detailed Changelog
				</Text>
				<Tabs defaultValue={"write"}>
					<Tabs.List>
						<Tabs.Tab value="write">Write</Tabs.Tab>
						<Tabs.Tab value="preview">Preview</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="write">
						<MarkdownEditor
							value={props.form.values.changelog}
							onChange={(v) => props.form.setFieldValue("changelog", v)}
						/>
					</Tabs.Panel>
					<Tabs.Panel value="preview">
						<Card withBorder my={"md"}>
							<Markdown content={props.form.values.changelog} />
						</Card>
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Card>
	);
}
