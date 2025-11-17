import mongoose, { Schema } from "mongoose";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		mod_id: { type: String, required: true },
		version: { type: String, required: true },
		changelog: { type: String, required: true },
		assets: { type: [Object], required: true },
		symbolicLinks: { type: [Object], default: [] },
		missionScripts: { type: [Object], default: [] },
		visibility: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

// Create index for efficient queries
schema.index({ mod_id: 1, createdAt: -1 });
schema.index({ mod_id: 1, visibility: 1, createdAt: -1 });

export const ModRelease = mongoose.model("ModRelease", schema);

await ModRelease.createCollection();
