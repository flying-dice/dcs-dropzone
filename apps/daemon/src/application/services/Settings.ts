import { normalize, join } from "node:path";
import { platform } from "node:os";
import { expandEnvVars } from "@packages/zod/expandEnvVars";
import { SymbolicLinkDestRoot } from "webapp";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { KeyValueRepository } from "../ports/KeyValueRepository.ts";

type Deps = {
	keyValueRepository: KeyValueRepository;
	fileSystem: FileSystem;
};

export type SettingsData = {
	dcsWorkingDir?: string;
	dcsInstallDir?: string;
	dropzoneModsDir?: string;
};

export type SettingsValidationEntry = {
	exists: boolean;
	resolvedPath?: string;
	error?: string;
};

export type SettingsValidationResult = {
	valid: boolean;
	dcsWorkingDir: SettingsValidationEntry;
	dcsInstallDir: SettingsValidationEntry;
	dropzoneModsDir: SettingsValidationEntry;
};

export class Settings {
	private static readonly DCS_WORKING_DIR_KEY = "dcs_working_dir";
	private static readonly DCS_INSTALL_DIR_KEY = "dcs_install_dir";
	private static readonly DROPZONE_MODS_DIR_KEY = "dropzone_mods_dir";

	private static readonly DEFAULT_DCS_WORKING_DIR =
		platform() === "win32"
			? join("%USERPROFILE%", "Saved Games", "DCS")
			: join("$HOME", "Saved Games", "DCS");
	private static readonly DEFAULT_DCS_INSTALL_DIR =
		platform() === "win32"
			? join("%PROGRAMFILES%", "Eagle Dynamics", "DCS World")
			: join("$HOME", "Eagle Dynamics", "DCS World");
	private static readonly DEFAULT_DROPZONE_MODS_DIR =
		platform() === "win32"
			? join("%LOCALAPPDATA%", "DCS Dropzone", "Mods")
			: join("$HOME", ".local", "share", "DCS Dropzone", "Mods");

	constructor(protected deps: Deps) {}

	/**
	 * Expands environment variables and normalizes a raw path value.
	 */
	private static resolvePath(raw: string | undefined): string | undefined {
		if (raw === undefined || raw.length === 0) return undefined;
		const expanded = expandEnvVars(raw);
		// If any %VAR% or $VAR placeholders remain, the env var wasn't defined — path is unusable
		if (/%[A-Za-z0-9_()]+%/.test(expanded) || /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/.test(expanded)) return undefined;
		return normalize(expanded);
	}

	private get(key: string): string | undefined {
		return this.deps.keyValueRepository.get(key);
	}

	private set(key: string, value: string | undefined): void {
		if (value) {
			this.deps.keyValueRepository.save(key, value);
		} else {
			this.deps.keyValueRepository.delete(key);
		}
	}

	/**
	 * Returns only the explicitly stored values, without defaults.
	 * Used by the API to show users what they have actually configured.
	 */
	getAll(): SettingsData {
		return {
			dcsWorkingDir: this.get(Settings.DCS_WORKING_DIR_KEY),
			dcsInstallDir: this.get(Settings.DCS_INSTALL_DIR_KEY),
			dropzoneModsDir: this.get(Settings.DROPZONE_MODS_DIR_KEY),
		};
	}

	/**
	 * Sets all settings. Empty/undefined values delete the stored key.
	 * Returns the stored values after update (without defaults).
	 */
	setAll(data: SettingsData): SettingsData {
		this.set(Settings.DCS_WORKING_DIR_KEY, data.dcsWorkingDir);
		this.set(Settings.DCS_INSTALL_DIR_KEY, data.dcsInstallDir);
		this.set(Settings.DROPZONE_MODS_DIR_KEY, data.dropzoneModsDir);
		return this.getAll();
	}

	getDcsWorkingDir(): string | undefined {
		return Settings.resolvePath(this.get(Settings.DCS_WORKING_DIR_KEY) ?? Settings.DEFAULT_DCS_WORKING_DIR);
	}

	getDcsInstallDir(): string | undefined {
		return Settings.resolvePath(this.get(Settings.DCS_INSTALL_DIR_KEY) ?? Settings.DEFAULT_DCS_INSTALL_DIR);
	}

	getDropzoneModsDir(): string | undefined {
		return Settings.resolvePath(this.get(Settings.DROPZONE_MODS_DIR_KEY) ?? Settings.DEFAULT_DROPZONE_MODS_DIR);
	}

	getDcsPathForSymbolicLinkDestRoot(root: SymbolicLinkDestRoot): string | undefined {
		switch (root) {
			case SymbolicLinkDestRoot.DCS_WORKING_DIR:
				return this.getDcsWorkingDir();
			case SymbolicLinkDestRoot.DCS_INSTALL_DIR:
				return this.getDcsInstallDir();
		}
	}

	validate(): SettingsValidationResult {
		const validateEntry = (resolvedPath: string | undefined): SettingsValidationEntry => {
			if (resolvedPath === undefined) {
				return { exists: false, resolvedPath };
			}

			const existsResult = this.deps.fileSystem.exists(resolvedPath);

			return existsResult.match(
				(exists) => ({ exists, resolvedPath }),
				(error) => ({ exists: false, resolvedPath, error: error.message }),
			);
		};

		const dcsWorkingDir = validateEntry(this.getDcsWorkingDir());
		const dcsInstallDir = validateEntry(this.getDcsInstallDir());
		const dropzoneModsDir = validateEntry(this.getDropzoneModsDir());

		return {
			valid: dcsWorkingDir.exists && dcsInstallDir.exists && dropzoneModsDir.exists,
			dcsWorkingDir,
			dcsInstallDir,
			dropzoneModsDir,
		};
	}
}
