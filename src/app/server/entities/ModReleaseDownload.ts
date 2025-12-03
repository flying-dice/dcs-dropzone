import mongoose, { Schema } from "mongoose";

const schema = new Schema(
	{
		releaseId: { type: String, required: true },
		modId: { type: String, required: true },
		daemonInstanceId: { type: String, required: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, autoIndex: true },
);

schema.index({ releaseId: 1, daemonInstanceId: 1 }, { unique: true });

export const ModReleaseDownload = mongoose.model("ModReleaseDownload", schema);
