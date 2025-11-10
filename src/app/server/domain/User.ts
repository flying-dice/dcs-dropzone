import { UserData } from "../schemas/UserData.ts";
import { DomainObject } from "./DomainObject.ts";

export class User extends DomainObject<typeof UserData> {
	constructor(data: UserData) {
		super(UserData, data);
	}

	get id(): string {
		return this.data.id;
	}
}
