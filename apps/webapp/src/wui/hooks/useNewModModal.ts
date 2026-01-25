import { modals, openModal } from "@mantine/modals";
import { showErrorNotification } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useNavigate } from "react-router-dom";
import { createUserMod } from "../_autogen/api.ts";
import type { NewModFormValues } from "../components/NewModForm.tsx";

/**
 * Custom hook for handling new mod creation modal and submission
 */
export function useNewModModal(onSuccess?: () => void | Promise<void>): {
	openNewModModal: (modalTitle: string, formComponent: React.ReactNode) => void;
	handleNewModSubmit: (values: NewModFormValues) => Promise<void>;
} {
	const nav = useNavigate();

	const handleNewModSubmit = async (values: NewModFormValues) => {
		try {
			const res = await createUserMod(values);
			if (res.status !== StatusCodes.CREATED) {
				throw new Error(`Failed to create mod: ${res.status}`);
			}
			if (onSuccess) {
				await onSuccess();
			}
			modals.closeAll();
			nav(res.data.id);
		} catch (e) {
			showErrorNotification(e);
		}
	};

	const openNewModModal = (modalTitle: string, formComponent: React.ReactNode) => {
		openModal({
			title: modalTitle,
			size: "xl",
			children: formComponent,
		});
	};

	return {
		openNewModModal,
		handleNewModSubmit,
	};
}
