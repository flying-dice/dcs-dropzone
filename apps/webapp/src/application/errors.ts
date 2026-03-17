export class UserNotFoundError extends Error {
	readonly _tag = "UserNotFound" as const;
	constructor() {
		super("User not found");
		this.name = "UserNotFoundError";
	}
}

export class ModNotFoundError extends Error {
	readonly _tag = "ModNotFound" as const;
	constructor() {
		super("Mod not found");
		this.name = "ModNotFoundError";
	}
}

export class ReleaseNotFoundError extends Error {
	readonly _tag = "ReleaseNotFound" as const;
	constructor() {
		super("Release not found");
		this.name = "ReleaseNotFoundError";
	}
}

export class NotFoundError extends Error {
	readonly _tag = "NotFound" as const;
	constructor() {
		super("Not found");
		this.name = "NotFoundError";
	}
}

export class NotMaintainerError extends Error {
	readonly _tag = "NotMaintainer" as const;
	constructor() {
		super("Not maintainer");
		this.name = "NotMaintainerError";
	}
}

export class FailedToGetDaemonReleasesError extends Error {
	readonly _tag = "FailedToGetDaemonReleases" as const;
	constructor() {
		super("Failed to get daemon releases");
		this.name = "FailedToGetDaemonReleasesError";
	}
}

export class FailedToFindDaemonReleaseError extends Error {
	readonly _tag = "FailedToFindDaemonRelease" as const;
	constructor() {
		super("Failed to find daemon release");
		this.name = "FailedToFindDaemonReleaseError";
	}
}

export class ToggleReleaseError extends Error {
	readonly _tag = "ToggleReleaseFailed" as const;
	constructor(message: string) {
		super(message);
		this.name = "ToggleReleaseError";
	}
}
