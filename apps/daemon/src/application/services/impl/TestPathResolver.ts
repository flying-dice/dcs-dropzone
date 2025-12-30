import { mock } from "bun:test";
import type { PathResolver } from "../PathResolver.ts";

export class TestPathResolver implements PathResolver {
	resolveReleasePath = mock<PathResolver["resolveReleasePath"]>();
	resolveSymbolicLinkPath = mock<PathResolver["resolveSymbolicLinkPath"]>();
}
