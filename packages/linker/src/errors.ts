/**
 * Error codes for linker operations. These can be mapped to actionable user feedback.
 */
export enum LinkerErrorCode {
	/** The symlink destination path already exists on disk */
	LinkAlreadyExists = "LINK_ALREADY_EXISTS",
	/** The symlink source (target) path does not exist */
	SourceNotFound = "SOURCE_NOT_FOUND",
	/** Insufficient permissions to create the symlink (e.g. UAC elevation denied) */
	PermissionDenied = "PERMISSION_DENIED",
	/** General symlink creation failure */
	LinkCreationFailed = "LINK_CREATION_FAILED",
}

export class SymlinkCreationFailed extends Error {
	readonly type = "SymlinkCreationFailed" as const;

	constructor(
		/** The ID of the link that failed */
		readonly linkId: string,
		/** Machine-readable error code for actionable feedback */
		readonly code: LinkerErrorCode,
		message: string,
	) {
		super(`Failed to create symlink for ${linkId}: ${message}`);
	}
}

export type LinkerError = SymlinkCreationFailed;
