import { mock } from "bun:test";
import type { ReleaseToggle } from "../ReleaseToggle.ts";

export class TestReleaseToggle implements ReleaseToggle {
	public readonly mockEnable = mock();
	public readonly mockDisable = mock();

	enable(releaseId: string) {
		this.mockEnable(releaseId);
	}

	disable(releaseId: string) {
		this.mockDisable(releaseId);
	}
}
