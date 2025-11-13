import { Button, Card, FileButton, Stack, Text } from "@mantine/core";
import { FaCamera } from "react-icons/fa6";
import { ModImage } from "../../components/ModImage.tsx";
import { fileToDataURI } from "../../utils/fileToDataUri.ts";
import type { UserModForm } from "./form.ts";

export function _Thumbnail(props: { form: UserModForm }) {
	const handleFileChange = async (file: File | null) => {
		if (file) {
			const uploadedImageUrl = await fileToDataURI(file);
			props.form.setFieldValue("thumbnail", uploadedImageUrl);
		}
	};

	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Thumbnail
				</Text>
				<ModImage src={props.form.values.thumbnail} radius={5} />
				<FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
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
	);
}
