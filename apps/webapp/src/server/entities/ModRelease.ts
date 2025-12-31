import mongoose, { type InferRawDocType, type InferSchemaType, Schema } from "mongoose";
import objectHash from "object-hash";
import { MongoMigration } from "../infrastructure/mongo-db/MongoMigration.ts";

const schema = new Schema(
	{
		id: { type: String, required: true, unique: true },
		modId: { type: String, required: true },
		version: { type: String, required: true },
		versionHash: { type: String, required: true },
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
export type ModRelease = InferSchemaType<typeof schema>;
export type ModReleaseRawDocType = InferRawDocType<typeof schema>;

export const ModReleaseMigrations = [
	new MongoMigration("17122025_add_version_hash", async () => {
		const releases = await ModRelease.find({ versionHash: { $exists: false } }).exec();
		for (const release of releases) {
			release.versionHash = objectHash(Date.now());
			await release.save();
		}
	}),
];
