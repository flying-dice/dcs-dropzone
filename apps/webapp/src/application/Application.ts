import type { AuthenticationProvider } from "./ports/AuthenticationProvider.ts";
import type { DownloadsRepository } from "./ports/DownloadsRepository.ts";
import type { ModRepository } from "./ports/ModRepository.ts";
import type { UserRepository } from "./ports/UserRepository.ts";
import type { UUIDGenerator } from "./ports/UUIDGenerator.ts";
import { Downloads } from "./services/Downloads.ts";
import { PublicMods } from "./services/PublicMods.ts";
import { UserMods } from "./services/UserMods.ts";
import { Users } from "./services/Users.ts";
import { WebFlowAuthenticator } from "./services/WebFlowAuthenticator.ts";

type Deps = {
	authProvider: AuthenticationProvider;
	userRepository: UserRepository;
	modRepository: ModRepository;
	downloadsRepository: DownloadsRepository;
	generateUuid: UUIDGenerator;
};

export abstract class Application {
	public readonly userMods: UserMods;
	public readonly users: Users;
	public readonly authenticator: WebFlowAuthenticator;
	public readonly publicMods: PublicMods;
	public readonly downloads: Downloads;

	protected constructor(public readonly deps: Deps) {
		this.users = new Users(deps);
		this.userMods = new UserMods(deps);
		this.authenticator = new WebFlowAuthenticator({ ...deps, users: this.users });
		this.publicMods = new PublicMods(deps);
		this.downloads = new Downloads(deps);
	}
}
