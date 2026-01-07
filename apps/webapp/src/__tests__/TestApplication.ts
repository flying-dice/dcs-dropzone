import { Application } from "../application/Application.ts";
import { TestDownloadsRepository } from "./TestDownloadsRepository.ts";
import { TestModRepository } from "./TestModRepository.ts";
import { TestUserRepository } from "./TestUserRepository.ts";
import { TestUUIDGenerator } from "./TestUUIDGenerator.ts";

/**
 * Test implementation of the Application class using test doubles for all ports.
 * Provides direct access to repositories for test assertions.
 */
export class TestApplication extends Application {
	public readonly testUserRepository: TestUserRepository;
	public readonly testModRepository: TestModRepository;
	public readonly testDownloadsRepository: TestDownloadsRepository;

	constructor() {
		const userRepository = new TestUserRepository();
		const modRepository = new TestModRepository();
		const downloadsRepository = new TestDownloadsRepository();
		const generateUuid = TestUUIDGenerator();

		super({
			userRepository,
			modRepository,
			downloadsRepository,
			generateUuid,
		});

		this.testUserRepository = userRepository;
		this.testModRepository = modRepository;
		this.testDownloadsRepository = downloadsRepository;
	}
}
