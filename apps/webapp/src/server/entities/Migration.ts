import type { InferRawDocType, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		status: { type: String, required: true },
		error: { type: String, required: false },

		startedBy: { type: String, required: true },
		startedAt: { type: Date, default: Date.now },

		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

export const Migration = mongoose.model("Migration", schema);
export type Migration = InferSchemaType<typeof schema>;
export type MigrationRawDocType = InferRawDocType<typeof schema>;
