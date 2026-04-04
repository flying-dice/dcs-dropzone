export class SymlinkCreationFailed extends Error {
	readonly type = "SymlinkCreationFailed" as const;
}

export class SourcePathNotConfigured extends Error {
	readonly type = "SourcePathNotConfigured" as const;
	constructor(message?: string) {
		super(message ?? "Source path is not configured");
	}
}

export class DestinationPathNotConfigured extends Error {
	readonly type = "DestinationPathNotConfigured" as const;
	constructor(message?: string) {
		super(message ?? "Destination path is not configured");
	}
}

export type LinkerError = SymlinkCreationFailed | SourcePathNotConfigured | DestinationPathNotConfigured;
