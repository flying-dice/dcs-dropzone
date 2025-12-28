import type { GetDaemonInstanceId } from "../repository/GetDaemonInstanceId.ts";
import type { SaveDaemonInstanceId } from "../repository/SaveDaemonInstanceId.ts";

export class GetOrSetDaemonInstanceId {
	constructor(
		protected deps: {
			getDaemonInstanceId: GetDaemonInstanceId;
			saveDaemonInstanceId: SaveDaemonInstanceId;
			generateUuid: () => string;
		},
	) {}

	execute(): string {
		return this.deps.getDaemonInstanceId.execute() ?? this.deps.saveDaemonInstanceId.execute(this.deps.generateUuid());
	}
}
