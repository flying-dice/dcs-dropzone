import type { JobRepo } from "../ports/JobRepo.ts";
import type { RunRepo } from "../ports/RunRepo.ts";
import { type Job, RunState } from "../types.ts";

/**
 * In-memory implementation of JobRepo for testing and development.
 */
export class InMemoryJobRepo implements JobRepo {
	private jobs: Map<string, Job> = new Map();

	constructor(protected readonly runRepo: RunRepo) {}

	/**
	 * Clear all jobs. Useful for testing.
	 */
	clear(): void {
		this.jobs.clear();
	}

	async markCompleted(id: string, completedAt: Date): Promise<void> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new Error(`Job ${id} not found`);
		}
		job.completedAt = completedAt;
	}

	async incrementAttempts(id: string): Promise<number> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new Error(`Job ${id} not found`);
		}
		job.attempts += 1;
		return job.attempts;
	}

	async reschedule(id: string, attempt: number, scheduledAt: Date): Promise<void> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new Error(`Job ${id} not found`);
		}
		job.attempts = attempt;
		job.scheduledAt = scheduledAt;
	}

	async save(job: Job): Promise<Job> {
		this.jobs.set(job.id, { ...job });
		return this.jobs.get(job.id)!;
	}

	async findById(id: string): Promise<Job | undefined> {
		const job = this.jobs.get(id);
		return job ? { ...job } : undefined;
	}

	async findNextEligible(name: string): Promise<Job | undefined> {
		const now = new Date();

		const eligible: Job[] = this.jobs
			.values()
			.filter((it) => it.name === name && it.completedAt === undefined && it.scheduledAt <= now)
			.toArray()
			.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
			.filter((job) => this.runRepo.findLatestByJobId(job.id).then((run) => run?.state !== RunState.Running));

		if (eligible.length > 0) {
			console.log(
				`Eligible jobs for processor ${name}:`,
				eligible.map((j) => j.id),
			);

			return { ...eligible[0] } as Job;
		}
	}

	async updateProgress(id: string, progress: number, progressUpdatedAt: Date): Promise<void> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new Error(`Job ${id} not found`);
		}
		job.progress = progress;
		job.progressUpdatedAt = progressUpdatedAt;
	}

	async list(name?: string): Promise<Job[]> {
		return this.getJobsSortedByScheduledAt((job) => (name ? job.name === name : true));
	}

	async listPending(name?: string): Promise<Job[]> {
		return this.getJobsSortedByScheduledAt((job) => (name ? job.name === name : true) && job.completedAt === undefined);
	}

	async listCompleted(name?: string): Promise<Job[]> {
		return this.getJobsSortedByScheduledAt((job) => (name ? job.name === name : true) && job.completedAt !== undefined);
	}

	private getJobsSortedByScheduledAt(filter?: (job: Job) => boolean): Job[] {
		return Array.from(this.jobs.values().filter(filter ? filter : () => true)).sort(
			(a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
		);
	}
}
