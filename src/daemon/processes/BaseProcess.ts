import type { ChildProcess } from "node:child_process";
import type { Logger } from "pino";

/**
 * Progress update from a running process
 */
export type ProcessProgress = {
	progress: number;
	summary?: string;
};

/**
 * Process execution result
 */
export type ProcessResult = {
	success: boolean;
	exitCode: number | null;
	error?: Error;
};

/**
 * Abstract Base Process
 * Manages OS process lifecycle with strict one-instance-per-job enforcement
 */
export abstract class BaseProcess {
	/**
	 * Static registry of all active process instances
	 * Key: Job ID
	 * Value: Process instance
	 */
	private static readonly activeProcesses = new Map<string, BaseProcess>();

	protected process?: ChildProcess;
	protected readonly jobId: string;
	protected readonly logger: Logger;

	constructor(jobId: string, logger: Logger) {
		// Enforce one-instance-per-job
		if (BaseProcess.activeProcesses.has(jobId)) {
			throw new Error(
				`Process for job ${jobId} is already running. Only one instance per job is allowed.`,
			);
		}

		this.jobId = jobId;
		this.logger = logger;

		// Register this instance
		BaseProcess.activeProcesses.set(jobId, this);
		this.logger.debug({ jobId }, "Process registered in active registry");
	}

	/**
	 * Get process ID if running
	 */
	getPid(): number | undefined {
		return this.process?.pid;
	}

	/**
	 * Check if process is running
	 */
	isRunning(): boolean {
		return this.process !== undefined && !this.process.killed;
	}

	/**
	 * Start the process
	 */
	async start(
		onProgress: (progress: ProcessProgress) => void,
	): Promise<ProcessResult> {
		if (this.isRunning()) {
			throw new Error(`Process for job ${this.jobId} is already running`);
		}

		try {
			const result = await this.executeProcess(onProgress);
			return result;
		} finally {
			// Always cleanup on completion
			this.cleanup();
		}
	}

	/**
	 * Cancel the running process
	 */
	async cancel(): Promise<void> {
		if (!this.process) {
			this.logger.warn({ jobId: this.jobId }, "No process to cancel");
			return;
		}

		this.logger.info(
			{ jobId: this.jobId, pid: this.process.pid },
			"Cancelling process",
		);

		// Send SIGTERM for graceful shutdown
		this.process.kill("SIGTERM");

		// Wait a bit for graceful shutdown
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Force kill if still running
		if (this.isRunning()) {
			this.logger.warn(
				{ jobId: this.jobId, pid: this.process.pid },
				"Process did not terminate gracefully, forcing kill",
			);
			this.process.kill("SIGKILL");
		}

		this.cleanup();
	}

	/**
	 * Cleanup and deregister from static registry
	 */
	private cleanup(): void {
		BaseProcess.activeProcesses.delete(this.jobId);
		this.process = undefined;
		this.logger.debug(
			{ jobId: this.jobId },
			"Process deregistered from active registry",
		);
	}

	/**
	 * Abstract method to be implemented by concrete classes
	 * Must spawn the actual OS process and handle its lifecycle
	 */
	protected abstract executeProcess(
		onProgress: (progress: ProcessProgress) => void,
	): Promise<ProcessResult>;

	/**
	 * Get active process for a job ID
	 */
	static getActiveProcess(jobId: string): BaseProcess | undefined {
		return BaseProcess.activeProcesses.get(jobId);
	}

	/**
	 * Cancel a job by ID
	 */
	static async cancelJob(jobId: string): Promise<boolean> {
		const process = BaseProcess.activeProcesses.get(jobId);
		if (!process) {
			return false;
		}

		await process.cancel();
		return true;
	}

	/**
	 * Get all active job IDs
	 */
	static getActiveJobIds(): string[] {
		return Array.from(BaseProcess.activeProcesses.keys());
	}

	/**
	 * Get count of active processes
	 */
	static getActiveProcessCount(): number {
		return BaseProcess.activeProcesses.size;
	}
}
