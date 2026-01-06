import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { Mod } from "../mongo-db/entities/Mod.ts";
import { User } from "../mongo-db/entities/User.ts";
import { ModData } from "../schemas/ModData.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("GetById");

export type GetModByIdResult = Result<
	{
		mod: ModData;
		maintainers: UserData[];
	},
	"ModNotFound"
>;

export default async function (id: string): Promise<GetModByIdResult> {
	logger.debug({ id }, "Finding mod by id");

	const doc = await Mod.findOne({ id, visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] } })
		.lean()
		.exec();

	if (!doc) {
		return err("ModNotFound");
	}

	const maintainers = await User.find({ id: { $in: doc.maintainers } })
		.lean()
		.exec();

	return ok({
		mod: ModData.parse(doc),
		maintainers: UserData.array().parse(maintainers),
	});
}
