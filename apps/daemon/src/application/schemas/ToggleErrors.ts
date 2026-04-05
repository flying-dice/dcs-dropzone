import { z } from "zod";
import { InvalidPathData } from "./InvalidPathData.ts";

export const ReleaseNotFoundError = z
	.object({
		reason: z.literal("ReleaseNotFound"),
	})
	.meta({ ref: "ReleaseNotFoundError" });

export const ReleaseNotReadyError = z
	.object({
		reason: z.literal("ReleaseNotReady"),
		pendingCount: z.number().int(),
		failedCount: z.number().int(),
	})
	.meta({ ref: "ReleaseNotReadyError" });

export const DropzoneModsDirNotConfiguredError = z
	.object({
		reason: z.literal("DropzoneModsDirNotConfigured"),
	})
	.meta({ ref: "DropzoneModsDirNotConfiguredError" });

export const DropzoneModsDirInvalidError = z
	.object({
		reason: z.literal("DropzoneModsDirInvalid"),
	})
	.merge(InvalidPathData)
	.meta({ ref: "DropzoneModsDirInvalidError" });

export const DcsPathNotConfiguredError = z
	.object({
		reason: z.literal("DcsPathNotConfigured"),
	})
	.meta({ ref: "DcsPathNotConfiguredError" });

export const DcsPathInvalidError = z
	.object({
		reason: z.literal("DcsPathInvalid"),
	})
	.merge(InvalidPathData)
	.meta({ ref: "DcsPathInvalidError" });

export const SymlinkCreationFailedError = z
	.object({
		reason: z.literal("SymlinkCreationFailed"),
		errorCode: z.enum(["SOURCE_NOT_FOUND", "LINK_ALREADY_EXISTS", "PERMISSION_DENIED", "LINK_CREATION_FAILED"]),
		systemError: z.string().optional(),
	})
	.meta({ ref: "SymlinkCreationFailedError" });

export const PartialDisableFailureError = z
	.object({
		reason: z.literal("PartialDisableFailure"),
		removedCount: z.number().int(),
		failedCount: z.number().int(),
		failures: z.array(z.object({ linkId: z.string(), message: z.string() })),
	})
	.meta({ ref: "PartialDisableFailureError" });

export const EnableReleaseError = z.discriminatedUnion("reason", [
	ReleaseNotFoundError,
	ReleaseNotReadyError,
	DropzoneModsDirNotConfiguredError,
	DropzoneModsDirInvalidError,
	DcsPathNotConfiguredError,
	DcsPathInvalidError,
	SymlinkCreationFailedError,
]);

export type EnableReleaseError = z.infer<typeof EnableReleaseError>;

export const DisableReleaseError = z.discriminatedUnion("reason", [
	ReleaseNotFoundError,
	DropzoneModsDirNotConfiguredError,
	DropzoneModsDirInvalidError,
	DcsPathNotConfiguredError,
	DcsPathInvalidError,
	PartialDisableFailureError,
]);

export type DisableReleaseError = z.infer<typeof DisableReleaseError>;

export const ToggleReleaseError = z.discriminatedUnion("reason", [
	ReleaseNotFoundError,
	ReleaseNotReadyError,
	DropzoneModsDirNotConfiguredError,
	DropzoneModsDirInvalidError,
	DcsPathNotConfiguredError,
	DcsPathInvalidError,
	SymlinkCreationFailedError,
	PartialDisableFailureError,
]);

export type ToggleReleaseError = z.infer<typeof ToggleReleaseError>;
