export interface AttributesRepository {
	getDaemonInstanceId(): string | undefined;
	saveDaemonInstanceId(instanceId: string): string;
}
