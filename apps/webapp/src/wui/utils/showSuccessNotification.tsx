import { showNotification } from "@mantine/notifications";

export function showSuccessNotification(title: string, message: string) {
	showNotification({
		title,
		message,
		color: "green",
	});
}
