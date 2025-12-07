import { Card, Stack, Tabs, Text } from "@mantine/core";
import { Markdown } from "../../components/Markdown.tsx";
import { MarkdownEditor } from "../../components/MarkdownEditor.tsx";
import type { UserModForm } from "./form.ts";

export function _Description(props: { form: UserModForm }) {
	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Detailed Description
				</Text>
				<Tabs defaultValue={"preview"}>
					<Tabs.List>
						<Tabs.Tab value="write">Write</Tabs.Tab>
						<Tabs.Tab value="preview">Preview</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="write">
						<MarkdownEditor
							value={props.form.values.content}
							onChange={(v) => props.form.setFieldValue("content", v)}
						/>
					</Tabs.Panel>
					<Tabs.Panel value="preview">
						<Card withBorder my={"md"}>
							<Markdown content={props.form.values.content} />
						</Card>
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Card>
	);
}
