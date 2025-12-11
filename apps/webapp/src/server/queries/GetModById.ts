import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { User } from "../entities/User.ts";
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

	const doc = await Mod.findOne({ id }).lean().exec();

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
