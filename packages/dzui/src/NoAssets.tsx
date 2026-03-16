import { FaFile } from "react-icons/fa6";
import { EmptyState } from "./EmptyState.tsx";

export function NoAssets() {
	return (
		<EmptyState
			title="No assets added"
			description="Add Assets & URLs for your mod files. These will be downloaded and extracted by the desktop client."
			icon={FaFile}
		/>
	);
}
