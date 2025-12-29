import type { AttributesRepository } from "../AttributesRepository.ts";

export class TestAttributesRepository implements AttributesRepository {
	private daemonInstanceId: string | undefined;

	getDaemonInstanceId(): string | undefined {
		return this.daemonInstanceId;
	}

	saveDaemonInstanceId(instanceId: string): string {
		this.daemonInstanceId = instanceId;
		return instanceId;
	}
}
