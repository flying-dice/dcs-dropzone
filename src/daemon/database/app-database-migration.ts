import { createHash } from "node:crypto";

export class AppDatabaseMigration {
	protected readonly _hash: string;

	constructor(
		protected readonly _name: string,
		protected readonly _sql: string,
	) {
		this._hash = createHash("sha256").update(this._name).digest("hex");
	}

	get filename(): string {
		return this._name;
	}

	get sql(): string {
		return this._sql;
	}

	get hash(): string {
		return this._hash;
	}
}
