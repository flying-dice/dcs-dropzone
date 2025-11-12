import mongoose, { Schema } from "mongoose";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		category: { type: String, required: true },
		description: { type: String, required: true },
		content: { type: String, required: true },
		tags: { type: [String], required: true },
		dependencies: { type: [String], required: true },
		screenshots: { type: [String], required: true },
		thumbnail: { type: String, required: true },
		visibility: { type: String, required: true },
		maintainers: { type: [String], required: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

export const Mod = mongoose.model("Mod", schema);
export const ModSummary = mongoose.model("ModSummary", schema);

await Mod.createCollection();

await ModSummary.db.dropCollection(ModSummary.collection.name);
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
				maintainers: 1,
				tags: 1,
				visibility: 1,
				createdAt: 1,
				updatedAt: 1,
			},
		},
	],
});
