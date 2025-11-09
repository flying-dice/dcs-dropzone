import { ModCategory, ModVisibility } from "../../../common/data.ts";
import type { User } from "./User.ts";

export interface ModProperties {
	id: string;
	name: string;
	category: ModCategory;
	description: string;
	content: string;
	tags: string[];
	dependencies: string[];
	screenshots: string[];
	thumbnail: string;
	visibility: ModVisibility;
	maintainers: User[];
}

export class Mod implements ModProperties {
	id: string;
	name: string;
	category: ModCategory;
	description: string;
	content: string;
	tags: string[];
	dependencies: string[];
	screenshots: string[];
	thumbnail: string;
	visibility: ModVisibility;
	maintainers: User[];

	constructor(props: ModProperties) {
		this.id = props.id;
		this.name = props.name;
		this.category = props.category;
		this.description = props.description;
		this.content = props.content;
		this.tags = props.tags;
		this.dependencies = props.dependencies;
		this.screenshots = props.screenshots;
		this.thumbnail = props.thumbnail;
		this.visibility = props.visibility;
		this.maintainers = props.maintainers;
	}

	updateProps(props: Omit<ModProperties, "id">): void {
		this.name = props.name;
		this.category = props.category;
		this.description = props.description;
		this.content = props.content;
		this.tags = props.tags;
		this.dependencies = props.dependencies;
		this.screenshots = props.screenshots;
		this.thumbnail = props.thumbnail;
		this.visibility = props.visibility;
		this.maintainers = props.maintainers;
	}

	canBeUpdatedBy(user: User): boolean {
		return this.maintainers.some(
			(maintainer) => maintainer.userId === user.userId,
		);
	}

	canBeDeletedBy(user: User): boolean {
		return this.maintainers.some(
			(maintainer) => maintainer.userId === user.userId,
		);
	}

	static default(
		props: Pick<ModProperties, "id" | "name" | "maintainers">,
	): Mod {
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
