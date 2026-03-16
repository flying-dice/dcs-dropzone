import { SymbolicLinkDestRoot } from "webapp";
import type { KeyValueRepository } from "../ports/KeyValueRepository.ts";

type Deps = {
	keyValueRepository: KeyValueRepository;
};

export class Settings {
	private static readonly DCS_WORKING_DIR_KEY = "dcs_working_dir";
	private static readonly DCS_INSTALL_DIR_KEY = "dcs_install_dir";
	private static readonly DROPZONE_MODS_DIR_KEY = "dropzone_mods_dir";

	constructor(protected deps: Deps) {}

	getDcsWorkingDir(): string | undefined {
		return this.deps.keyValueRepository.get(Settings.DCS_WORKING_DIR_KEY);
	}

	setDcsWorkingDir(value: string): string {
		return this.deps.keyValueRepository.save(Settings.DCS_WORKING_DIR_KEY, value);
	}

	getDcsInstallDir(): string | undefined {
		return this.deps.keyValueRepository.get(Settings.DCS_INSTALL_DIR_KEY);
	}

	setDcsInstallDir(value: string): string {
		return this.deps.keyValueRepository.save(Settings.DCS_INSTALL_DIR_KEY, value);
	}

	getDropzoneModsDir(): string | undefined {
		return this.deps.keyValueRepository.get(Settings.DROPZONE_MODS_DIR_KEY);
	}

	setDropzoneModsDir(value: string): string {
		return this.deps.keyValueRepository.save(Settings.DROPZONE_MODS_DIR_KEY, value);
	}

	getDcsPathForSymbolicLinkDestRoot(root: SymbolicLinkDestRoot): string | undefined {
		switch (root) {
			case SymbolicLinkDestRoot.DCS_WORKING_DIR:
				return this.getDcsWorkingDir();
			case SymbolicLinkDestRoot.DCS_INSTALL_DIR:
				return this.getDcsInstallDir();
		}
	}
}
