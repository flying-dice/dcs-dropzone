import { list } from "regedit-rs";

export type DcsVariant = "openbeta" | "stable";

export const ED_REGISTRY_KEYS: Record<DcsVariant, string> = {
	stable: "HKEY_CURRENT_USER\\Software\\Eagle Dynamics\\DCS World",
	openbeta: "HKEY_CURRENT_USER\\Software\\Eagle Dynamics\\DCS World OpenBeta",
};

export type DcsRegistryPath = {
	path: string;
	variant: DcsVariant;
};

export async function getDcsRegistryPath(): Promise<DcsRegistryPath | undefined> {
	const edListResults = await list(Object.values(ED_REGISTRY_KEYS));

	for (const [key, result] of Object.entries(edListResults)) {
		const variant = key === ED_REGISTRY_KEYS.stable ? "stable" : "openbeta";

		if ("Path" in result.values) {
			return {
				path: String(result.values.Path.value),
				variant,
			};
		}
	}
}
