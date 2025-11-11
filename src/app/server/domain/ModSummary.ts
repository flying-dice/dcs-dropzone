import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { DomainObject } from "./DomainObject.ts";

export class ModSummary extends DomainObject<typeof ModSummaryData> {
	constructor(data: ModSummaryData) {
		super(ModSummaryData, data);
	}

	get id(): string {
		return this.data.id;
	}
}
