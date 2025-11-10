import { ModCategory, ModVisibility } from "../../../common/data.ts";
import { ModData } from "../schemas/ModData.ts";
import { DomainObject } from "./DomainObject.ts";

export class Mod extends DomainObject<typeof ModData> {
	constructor(data: ModData) {
		super(ModData, data);
	}

	get id(): string {
		return this.data.id;
	}

	updateProps(props: Omit<ModData, "id">): void {
		this.setData({ id: this.data.id, ...props });
	}

	canBeUpdatedBy(user: string): boolean {
		return this.data.maintainers.includes(user);
	}

	canBeDeletedBy(user: string): boolean {
		return this.data.maintainers.includes(user);
	}

	static default(props: Pick<ModData, "id" | "name" | "maintainers">): Mod {
		return new Mod({
			id: props.id,
			name: props.name,
			category: ModCategory.Other,
			description: "",
			content: "",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "",
			visibility: ModVisibility.Private,
			maintainers: props.maintainers,
		});
	}
}
