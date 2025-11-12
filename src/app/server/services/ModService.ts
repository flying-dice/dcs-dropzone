import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/Mod.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";

export class ModService {
	async findAllPublishedMods(
		page: number,
		size: number,
	): Promise<{ data: ModSummaryData[]; page: PageData }> {
		const count = await ModSummary.countDocuments();

		const docs = await ModSummary.find({
			visibility: ModVisibility.Public,
		})
			.skip((page - 1) * size)
			.sort({ createdAt: -1 })
			.limit(size)
			.lean()
			.exec();

		return {
			data: ModSummaryData.array().parse(docs),
			page: PageData.parse({
				number: page,
				size: size,
				totalPages: Math.ceil(count / size) || 1,
				totalElements: count,
			}),
		};
	}
}
