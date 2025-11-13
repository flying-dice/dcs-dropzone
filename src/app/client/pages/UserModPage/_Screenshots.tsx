import {
	Button,
	Card,
	FileButton,
	Image,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { FaCamera } from "react-icons/fa6";
import { fileToDataURI } from "../../utils/fileToDataUri.ts";
import type { UserModForm } from "./form.ts";

export function _Screenshots(props: { form: UserModForm }) {
	const handleNewScreenshot = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			props.form.setFieldValue("screenshots", [
				...props.form.values.screenshots,
				uploadedImageUrl,
			]);
		}
	};

	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Screenshots
				</Text>
				<SimpleGrid cols={2}>
					{props.form.values.screenshots.map((screenshot) => (
						<Image key={screenshot} h={150} radius={"md"} src={screenshot} />
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
	);
}
