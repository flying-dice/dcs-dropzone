import { z } from "zod";
import type { ModCategory } from "../../../common/data.ts";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";

const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof Mod;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<Record<ModCategory, number>> {
	const result = await deps.orm
		.aggregate([
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
		])
		.exec();

	const counts: Record<ModCategory, number> = Object.values(
		ModCategory,
	).reduce(
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
