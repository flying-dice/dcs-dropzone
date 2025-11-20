export class MongoUrl {
	protected readonly _url: URL;

	constructor(public readonly uri: string) {
		const parsed = URL.parse(uri);
		if (!parsed) {
			throw new Error(`Invalid MongoDB URI: ${uri}`);
		}
		this._url = parsed;
	}

	isMemoryDatabase(): boolean {
		return this._url.hostname === "memory";
	}

	get port(): number | undefined {
		return this._url.port ? parseInt(this._url.port, 10) : undefined;
	}

	get dbName(): string | undefined {
		return this._url.pathname ? this._url.pathname.replace("/", "") : undefined;
	}

	toObject(): object {
		return {
			uri: this.uri,
			isMemoryDatabase: this.isMemoryDatabase(),
			port: this.port,
			dbName: this.dbName,
		};
	}
}
