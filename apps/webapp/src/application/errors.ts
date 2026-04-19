export class UserNotFoundError extends Error {
	constructor() {
		super("User not found");
	}
}

export class ModNotFoundError extends Error {
	override readonly name = "ModNotFoundError";
	constructor() {
		super("Mod not found");
	}
}

export class ReleaseNotFoundError extends Error {
	override readonly name = "ReleaseNotFoundError";
	constructor() {
		super("Release not found");
	}
}

export class NotFoundError extends Error {
	constructor() {
		super("Not found");
	}
}

export class NotMaintainerError extends Error {
	constructor() {
		super("Not maintainer");
	}
}

export class FailedToGetDaemonReleasesError extends Error {
	constructor() {
		super("Failed to get daemon releases");
	}
}

export class FailedToFindDaemonReleaseError extends Error {
	constructor() {
		super("Failed to find daemon release");
	}
}

export class ToggleReleaseError extends Error {}
