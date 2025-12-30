export interface ReleaseToggle {
	enable(releaseId: string): void;
	disable(releaseId: string): void;
}
