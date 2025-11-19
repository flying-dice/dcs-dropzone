import mongoose, { Schema } from "mongoose";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: false },
		username: { type: String, required: true },
		profileUrl: { type: String, required: true },
		avatarUrl: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

export const User = mongoose.model("User", schema);
