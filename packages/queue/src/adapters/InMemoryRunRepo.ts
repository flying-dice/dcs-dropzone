import type { Run } from "../Run.ts";
import type { RunRepo } from "../types.ts";

/**
 * In-memory implementation of RunRepo for testing and development.
 */
export class InMemoryRunRepo implements RunRepo {
	private runs: Map<string, Run> = new Map();

	async create(run: Run): Promise<Run> {
		this.runs.set(run.id, { ...run });
		return { ...run };
	}

	async findById(id: string): Promise<Run | undefined> {
		const run = this.runs.get(id);
		return run ? { ...run } : undefined;
	}

	async update(run: Run): Promise<Run> {
		if (!this.runs.has(run.id)) {
			throw new Error(`Run ${run.id} not found`);
		}
		this.runs.set(run.id, { ...run });
		return { ...run };
	}

	async findLatestByJobId(jobId: string): Promise<Run | undefined> {
		let latest: Run | undefined;

		for (const run of this.runs.values()) {
			if (run.jobId === jobId) {
				if (!latest || run.attempt > latest.attempt) {
					latest = run;
				}
			}
		}

		return latest ? { ...latest } : undefined;
	}

	async listByJobId(jobId: string): Promise<Run[]> {
		return Array.from(this.runs.values())
			.filter((r) => r.jobId === jobId)
			.sort((a, b) => a.attempt - b.attempt)
			.map((r) => ({ ...r }));
	}

	async listFailed(): Promise<Run[]> {
		return Array.from(this.runs.values())
			.filter((r) => r.state === "failed")
			.map((r) => ({ ...r }));
	}

	/**
	 * Clear all runs. Useful for testing.
	 */
	clear(): void {
		this.runs.clear();
	}
}
