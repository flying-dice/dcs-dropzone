import { mock } from "bun:test";
import type { AttributesRepository } from "./AttributesRepository.ts";

export class TestAttributesRepository implements AttributesRepository {
	get = mock<AttributesRepository["get"]>();
	save = mock<AttributesRepository["save"]>();
}
