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
		screenshots: { type: [Object], required: true },
		thumbnail: { type: String, required: true },
		visibility: { type: String, required: true },
		maintainers: { type: [String], required: true },
		averageRating: { type: Number, default: 0 },
		ratingsCount: { type: Number, default: 0 },
		downloadsCount: { type: Number, default: 0 },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

export const Mod = mongoose.model("Mod", schema);
