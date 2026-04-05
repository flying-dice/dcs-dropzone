import type { DelayCalculator } from "./DelayCalculator.ts";
import type { JobRecord } from "./JobRecordRepository.ts";

export class RetryBackoffManager {
	static readonly MAX_RETRIES = 3;

	/**
	 * Map to track when a jobId is eligible to run again after a failure, to prevent immediate retries
	 * This is not persisted to the database as a restart of the application will reset the retry eligibility
	 */
	private notBefore: Map<string, Date> = new Map<JobRecord["jobId"], Date>();
	private attempts: Map<string, number> = new Map<JobRecord["jobId"], number>();

	constructor(private readonly delayCalculator: DelayCalculator) {}

	trackFailure(jobId: JobRecord["jobId"]): void {
		const currentAttempts = this.attempts.get(jobId) ?? 0;
		this.attempts.set(jobId, currentAttempts + 1);
		this.notBefore.set(jobId, this.getNextNotBefore(currentAttempts + 1));
	}

	hasExhaustedRetries(jobId: JobRecord["jobId"]): boolean {
		return (this.attempts.get(jobId) ?? 0) >= RetryBackoffManager.MAX_RETRIES;
	}

	getAllJobIdsCurrentlyInBackoff(): JobRecord["jobId"][] {
		const now = new Date();
		const jobIdsInBackoff: JobRecord["jobId"][] = [];
		for (const [jobId, notBeforeDate] of this.notBefore.entries()) {
			if (notBeforeDate > now) {
				jobIdsInBackoff.push(jobId);
			}
		}
		return jobIdsInBackoff;
	}

	private getNextNotBefore(attempts: number): Date {
		const delayMs = this.delayCalculator.calculateDelayMs(attempts);
		return new Date(Date.now() + delayMs);
	}
}
