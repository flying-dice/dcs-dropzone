import mongoose, { Schema } from "mongoose";
import { MigrationService } from "../services/MigrationService.ts";
import { Mod } from "./Mod.ts";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		category: { type: String, required: true },
		description: { type: String, required: true },
		tags: { type: [String], required: true },
		dependencies: { type: [String], required: true },
		thumbnail: { type: String, required: true },
		visibility: { type: String, required: true },
		maintainers: { type: [String], required: true },
		featuredAt: { type: Date, default: null },
		downloadsCount: { type: Number, default: 0 },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

export const ModSummary = mongoose.model("ModSummary", schema);

await MigrationService.runMigration("20112025_mod_summary", async () => {
	await ModSummary.collection.drop();
	await ModSummary.createCollection({
		viewOn: Mod.collection.name,
		pipeline: [
			{
				$project: {
					id: 1,
					name: 1,
					category: 1,
					description: 1,
					thumbnail: 1,
					dependencies: 1,
					maintainers: 1,
					tags: 1,
					visibility: 1,
					downloadsCount: 1,
					featuredAt: 1,
					createdAt: 1,
					updatedAt: 1,
				},
			},
		],
	});
});
