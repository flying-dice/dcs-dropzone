import { ModCategory, ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";

export async function getCategoryCounts(): Promise<
	Record<ModCategory, number>
> {
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
