export interface SetInstalledPathForLinkId {
	execute(symbolicLinkId: string, installedPath: string | null): void;
}
