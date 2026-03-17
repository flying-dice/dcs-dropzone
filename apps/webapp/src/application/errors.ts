export class UserNotFoundError extends Error {
	constructor() {
		super("User not found");
		this.name = "UserNotFound";
	}
}

export class ModNotFoundError extends Error {
	constructor() {
		super("Mod not found");
		this.name = "ModNotFound";
	}
}

export class ReleaseNotFoundError extends Error {
	constructor() {
		super("Release not found");
		this.name = "ReleaseNotFound";
	}
}

export class NotFoundError extends Error {
	constructor() {
		super("Not found");
		this.name = "NotFound";
	}
}

export class NotMaintainerError extends Error {
	constructor() {
		super("Not maintainer");
		this.name = "NotMaintainer";
	}
}

export class FailedToGetDaemonReleasesError extends Error {
	constructor() {
		super("Failed to get daemon releases");
		this.name = "FailedToGetDaemonReleases";
	}
}

export class FailedToFindDaemonReleaseError extends Error {
	constructor() {
		super("Failed to find daemon release");
		this.name = "FailedToFindDaemonRelease";
	}
}

export class ToggleReleaseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ToggleReleaseFailed";
	}
}
