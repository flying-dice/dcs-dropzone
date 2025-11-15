import { useTranslation } from "react-i18next";
import type { I18nKeys } from "./I18nKeys.ts";

export function useAppTranslation() {
	const { t } = useTranslation();

	return {
		t: (key: I18nKeys, options?: Record<string, string | number>) =>
			options
				? t(key as unknown as string, options)
				: t(key as unknown as string),
	};
}
