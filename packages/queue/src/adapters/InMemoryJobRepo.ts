import type { Job } from "../Job.ts";
import type { JobRepo } from "../types.ts";

/**
 * In-memory implementation of JobRepo for testing and development.
 */
export class InMemoryJobRepo implements JobRepo {
	private jobs: Map<string, Job> = new Map();

	async create(job: Job): Promise<Job> {
		this.jobs.set(job.id, { ...job });
		return { ...job };
	}

	async findById(id: string): Promise<Job | undefined> {
		const job = this.jobs.get(id);
		return job ? { ...job } : undefined;
	}

	async findNextEligible(queues: string[]): Promise<Job | undefined> {
		const now = new Date();
		const queueSet = new Set(queues);

		let eligible: Job | undefined;

		for (const job of this.jobs.values()) {
			if (queueSet.has(job.queue) && job.completedAt === undefined && job.scheduledAt <= now) {
				if (!eligible || job.scheduledAt < eligible.scheduledAt) {
					eligible = job;
				}
			}
		}

		return eligible ? { ...eligible } : undefined;
	}

	async update(job: Job): Promise<Job> {
		if (!this.jobs.has(job.id)) {
			throw new Error(`Job ${job.id} not found`);
		}
		this.jobs.set(job.id, { ...job });
		return { ...job };
	}

	async updateProgress(id: string, progress: unknown, progressUpdatedAt: Date): Promise<void> {
		const job = this.jobs.get(id);
		if (!job) {
			throw new Error(`Job ${id} not found`);
		}
		job.progress = progress;
		job.progressUpdatedAt = progressUpdatedAt;
	}

	async list(queue?: string): Promise<Job[]> {
		const jobs = Array.from(this.jobs.values());
		if (queue) {
			return jobs.filter((j) => j.queue === queue).map((j) => ({ ...j }));
		}
		return jobs.map((j) => ({ ...j }));
	}

	async listPending(queue?: string): Promise<Job[]> {
		const jobs = Array.from(this.jobs.values()).filter((j) => j.completedAt === undefined);
		if (queue) {
			return jobs.filter((j) => j.queue === queue).map((j) => ({ ...j }));
		}
		return jobs.map((j) => ({ ...j }));
	}

	async listCompleted(queue?: string): Promise<Job[]> {
		const jobs = Array.from(this.jobs.values()).filter((j) => j.completedAt !== undefined);
		if (queue) {
			return jobs.filter((j) => j.queue === queue).map((j) => ({ ...j }));
		}
		return jobs.map((j) => ({ ...j }));
	}

	/**
	 * Clear all jobs. Useful for testing.
	 */
	clear(): void {
		this.jobs.clear();
	}
}
