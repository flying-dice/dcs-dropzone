import mongoose from "mongoose";
import { ModCategory, ModVisibility } from "../../../common/data.ts";

export const ModSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		category: { type: String, required: true, enum: ModCategory },
		description: { type: String, required: true },
		content: { type: String, required: true },
		tags: { type: [String], default: [] },
		dependencies: { type: [String], default: [] },
		screenshots: { type: [String], default: [] },
		thumbnail: { type: String, required: true },
		visibility: { type: String, required: true, enum: ModVisibility },
		maintainers: { type: [String], required: true },
		subscriptions: { type: Number, default: 0 },
		rating: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

export const Mod = mongoose.model("Mod", ModSchema);

export const UserSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
		login: { type: String, required: true, unique: true },
		name: { type: String, required: false },
		profileUrl: { type: String, required: true },
		avatarUrl: { type: String, required: true },
	},
	{ timestamps: true },
);

export const User = mongoose.model("User", UserSchema);
