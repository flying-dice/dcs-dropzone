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
		featuredAt: { type: Date, default: null },
		downloadsCount: { type: Number, default: 0 },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

export const ModRelease = mongoose.model("ModRelease", schema);
