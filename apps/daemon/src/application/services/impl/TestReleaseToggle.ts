import { mock } from "bun:test";
import type { ReleaseToggle } from "../ReleaseToggle.ts";

export class TestReleaseToggle implements ReleaseToggle {
	public enable = mock<ReleaseToggle["enable"]>();
	public disable = mock<ReleaseToggle["disable"]>();
}
