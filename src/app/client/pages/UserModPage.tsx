import {
	AppShell,
	Button,
	Card,
	Container,
	FileButton,
	Flex,
	Group,
	Image,
	Rating,
	Select,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	TextInput,
	useComputedColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { FaCamera } from "react-icons/fa6";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { data, ModCategory, ModVisibility } from "../../../common/data.ts";
import {
	type AuthenticatedUser,
	useGetUserModById,
} from "../_autogen/legacy_api.ts";
import { AppDependenciesInput } from "../components/AppDependenciesInput.tsx";
import { AppTagsInput } from "../components/AppTagsInput.tsx";
import { Markdown } from "../components/Markdown.tsx";
import { MarkdownEditor } from "../components/MarkdownEditor.tsx";
import { ModImage } from "../components/ModImage.tsx";

const userModFormValues = z.object({
	name: z.string().min(2, { message: "Name should have at least 2 letters" }),
	category: z.enum(ModCategory),
	description: z
		.string()
		.min(10, { message: "Short Description should have at least 10 letters" }),
	content: z.string().min(20, {
		message: "Detailed Description should have at least 20 letters",
	}),
	tags: z.array(z.string()),
	dependencies: z.array(z.string()),
	thumbnail: z.string().url(),
	screenshots: z.array(z.string().url()),
	visibility: z.enum(ModVisibility),
});
export type UserModFormValues = z.infer<typeof userModFormValues>;

export type UserModPageProps = {
	user: AuthenticatedUser;
};

export function UserModPage(props: UserModPageProps) {
	const params = useParams<{ modId: string }>();
	const colorScheme = useComputedColorScheme();
	const mod = useGetUserModById(params.modId || "undefined");

	const form = useForm<UserModFormValues>({
		initialValues:
			mod.data?.status === 200 && mod.data.data
				? {
						name: mod.data.data.name,
						category: mod.data.data.category || ModCategory.Mod,
						description: mod.data.data.description || "",
						content: mod.data.data.content || "",
						tags: mod.data.data.tags || [],
						thumbnail: mod.data.data.imageUrl,
						dependencies: mod.data.data.dependencies,
						screenshots: [],
						visibility: mod.data.data.published
							? ModVisibility.Public
							: ModVisibility.Unlisted,
					}
				: {
						name: "Enter mod name",
						category: ModCategory.Mod,
						description: "Put a short description here...",
						content: "Write your detailed description here **in markdown**...",
						tags: [],
						thumbnail: "",
						screenshots: [],
						visibility: ModVisibility.Private,
						dependencies: [],
					},
		validate: zod4Resolver(userModFormValues),
	});

	const handleFileChange = (file: File | null) => {
		if (file) {
			const uploadedImageUrl = URL.createObjectURL(file); // Placeholder logic
			form.setFieldValue("thumbnail", uploadedImageUrl);
		}
	};

	const handleNewScreenshot = (file: File | null) => {
		if (file) {
			const uploadedImageUrl = URL.createObjectURL(file);
			form.setFieldValue("screenshots", [
				...form.values.screenshots,
				uploadedImageUrl,
			]);
		}
	};

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"} p={"md"}>
				<Flex gap={"md"}>
					<Stack flex={"auto"} gap={"lg"}>
						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Basic Information
								</Text>
								<TextInput label="Mod Name" {...form.getInputProps("name")} />
								<Select
									label={"Category"}
									data={data.categories}
									{...form.getInputProps("category")}
								/>
								<TextInput
									label="Short Description"
									{...form.getInputProps("description")}
								/>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Detailed Description
								</Text>
								<Tabs defaultValue={"write"}>
									<Tabs.List>
										<Tabs.Tab value="write">Write</Tabs.Tab>
										<Tabs.Tab value="preview">Preview</Tabs.Tab>
									</Tabs.List>

									<Tabs.Panel value="write">
										<MarkdownEditor
											value={form.values.content}
											onChange={(v) => form.setFieldValue("content", v)}
										/>
									</Tabs.Panel>
									<Tabs.Panel value="preview">
										<Card withBorder my={"md"}>
											<Markdown content={form.values.content} />
										</Card>
									</Tabs.Panel>
								</Tabs>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Tags
								</Text>

								<AppTagsInput
									value={form.values.tags}
									onChange={(v) => form.setFieldValue("tags", v)}
								/>
							</Stack>
						</Card>
						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Dependencies
								</Text>

								<AppDependenciesInput
									value={form.values.dependencies}
									onChange={(v) => form.setFieldValue("dependencies", v)}
								/>
							</Stack>
						</Card>
					</Stack>
					<Stack>
						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Thumbnail
								</Text>
								<ModImage src={form.values.thumbnail} w={300} radius={5} />
								<FileButton
									onChange={handleFileChange}
									accept="image/png,image/jpeg"
								>
									{(props) => (
										<Button
											{...props}
											fw={"normal"}
											variant={"default"}
											leftSection={<FaCamera />}
										>
											Change Thumbnail
										</Button>
									)}
								</FileButton>
							</Stack>
						</Card>

						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Screenshots
								</Text>
								<SimpleGrid cols={2}>
									{form.values.screenshots.map((screenshot) => (
										<Image
											key={screenshot}
											h={150}
											radius={"md"}
											src={screenshot}
										/>
									))}
								</SimpleGrid>
								<FileButton
									onChange={handleNewScreenshot}
									accept="image/png,image/jpeg"
								>
									{(props) => (
										<Button
											{...props}
											fw={"normal"}
											variant={"default"}
											leftSection={<FaCamera />}
										>
											Upload Screenshot
										</Button>
									)}
								</FileButton>
							</Stack>
						</Card>

						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Visibility & Permissions
								</Text>
								<Select
									label={"Visibility"}
									{...form.getInputProps("visibility")}
									data={data.visibilities}
								/>
							</Stack>
						</Card>

						<Card withBorder>
							<Stack>
								<Text size={"lg"} fw={"bold"}>
									Quick Stats
								</Text>
								<Group justify={"space-between"}>
									<Text c={"gray"}>Subscriptions</Text>
									<Text fw={"bold"}>300</Text>
								</Group>
								<Group justify={"space-between"}>
									<Text c={"gray"}>Average Rating</Text>
									<Group gap={"xs"}>
										<Text fw={"bold"}>4.8</Text>
										<Rating readOnly value={4.8} />
									</Group>
								</Group>
							</Stack>
						</Card>
					</Stack>
				</Flex>
			</Container>
		</AppShell.Main>
	);
}
