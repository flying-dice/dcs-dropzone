import mongoose, { type InferSchemaType } from "mongoose";
import { ModCategory, ModVisibility } from "../../../common/data.ts";

export const ModSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
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
	},
	{ timestamps: true },
);

export type ModDocument = InferSchemaType<typeof ModSchema>;

export const ModModel = mongoose.model("Mod", ModSchema);

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

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const UserModel = mongoose.model("User", UserSchema);
