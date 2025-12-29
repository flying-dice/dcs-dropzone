export interface IReleaseToggle {
	enable(releaseId: string): void;
	disable(releaseId: string): void;
}
