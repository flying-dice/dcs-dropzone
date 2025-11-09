import { createMiddleware } from "hono/factory";
import type { UserDto } from "../dto/UserDto.ts";
import { MongooseModRepository } from "../repsotiory/impl/MongooseModRepository.ts";
import { MongooseUserRepository } from "../repsotiory/impl/MongooseUserRepository.ts";
import { UserModService } from "../services/impl/UserModService.ts";

type Env = {
	Variables: {
		getUser: () => UserDto;
		getUserModService: () => UserModService;
	};
};

export const userModService = () =>
	createMiddleware<Env>(async (c, next) => {
		const user = c.var.getUser();

		const userRepo = new MongooseUserRepository();

		const userModService = new UserModService(
			new MongooseModRepository(userRepo),
			userRepo,
			user,
		);

		c.set("getUserModService", () => userModService);

		await next();
	});
