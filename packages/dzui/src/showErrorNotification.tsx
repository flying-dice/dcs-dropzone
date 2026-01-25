import { showNotification } from "@mantine/notifications";

export function showErrorNotification(error: Error | unknown) {
	if (error instanceof Error) {
		showNotification({
			title: error.name,
			message: error.message,
			color: "red",
		});
	} else {
		showNotification({
			title: "Error",
			message: "An unknown error occurred",
			color: "red",
		});
	}
}
