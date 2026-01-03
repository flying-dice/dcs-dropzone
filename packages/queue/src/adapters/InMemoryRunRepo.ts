import type { RunRepo } from "../ports";
import { type Run, RunState } from "../types.ts";

/**
 * In-memory implementation of RunRepo for testing and development.
 */
export class InMemoryRunRepo implements RunRepo {
	private runs: Map<string, Run> = new Map();

	/**
	 * Clear all runs. Useful for testing.
	 */
	clear(): void {
		this.runs.clear();
	}

	async save(run: Run): Promise<Run> {
		this.runs.set(run.id, { ...run });
		return this.runs.get(run.id)!;
	}

	async findById(id: string): Promise<Run | undefined> {
		const run = this.runs.get(id);
		return run ? { ...run } : undefined;
	}

	async findLatestByJobId(jobId: string): Promise<Run | undefined> {
		const runsForJob = this.getSortedByStartedAt((run) => run.jobId === jobId);
		return runsForJob.length > 0 ? runsForJob[runsForJob.length - 1] : undefined;
	}

	async listByJobId(jobId: string): Promise<Run[]> {
		return this.getSortedByStartedAt((run) => run.jobId === jobId);
	}

	async listFailed(): Promise<Run[]> {
		return this.getSortedByStartedAt((run) => run.state === RunState.Failed);
	}

	async listRunning(): Promise<Run[]> {
		return this.getSortedByStartedAt((run) => run.state === RunState.Running);
	}

	async listSuccess(): Promise<Run[]> {
		return this.getSortedByStartedAt((run) => run.state === RunState.Success);
	}

	private getSortedByStartedAt(filter?: (run: Run) => boolean): Run[] {
		return Array.from(this.runs.values())
			.filter(filter ?? (() => true))
			.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
	}
}
