export interface UserProperties {
	userId: string;
	userLogin: string;
	userName?: string;
	userAvatarUrl: string;
	userProfileUrl: string;
}

export class User implements UserProperties {
	userId: string;
	userLogin: string;
	userName?: string;
	userAvatarUrl: string;
	userProfileUrl: string;

	constructor(properties: UserProperties) {
		this.userId = properties.userId;
		this.userLogin = properties.userLogin;
		this.userName = properties.userName;
		this.userAvatarUrl = properties.userAvatarUrl;
		this.userProfileUrl = properties.userProfileUrl;
	}
}
