import { Mod } from "../entities/Mod.ts";
import { ModCategory } from "../enums/ModCategory.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";

type GetCategoryCounts = Record<ModCategory, number>;

export default async function (): Promise<GetCategoryCounts> {
	const result = await Mod.aggregate([
		{
			$match: {
				visibility: ModVisibility.PUBLIC,
			},
		},
		{
			$group: {
				_id: "$category",
				count: { $sum: 1 },
			},
		},
	]).exec();

	const counts: Record<ModCategory, number> = Object.values(ModCategory).reduce(
		(acc, category) => {
			acc[category] = 0;
			return acc;
		},
		{} as Record<ModCategory, number>,
	);

	for (const entry of result) {
		counts[entry._id as ModCategory] = entry.count;
	}

	return counts;
}
