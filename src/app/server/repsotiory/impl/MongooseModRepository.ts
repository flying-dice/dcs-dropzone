import mongoose, { type InferSchemaType } from "mongoose";
import { ModCategory, ModVisibility } from "../../../../common/data.ts";
import { Mod } from "../../domain/Mod.ts";
import type { User } from "../../domain/User.ts";
import type { ModRepository } from "../ModRepository.ts";
import type { UserRepository } from "../UserRepository.ts";

const _Schema = new mongoose.Schema(
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

type _Document = InferSchemaType<typeof _Schema>;

const _Model = mongoose.model("Mod", _Schema);

export class MongooseModRepository implements ModRepository {
	constructor(private readonly userRepository: UserRepository) {}

	async getNextId(): Promise<string> {
		return crypto.randomUUID();
	}

	async getById(id: string): Promise<Mod | undefined> {
		const document = await _Model.findOne({ id }).exec();

		if (!document) {
			return undefined;
		}

		return this.fromDocument(document);
	}

	async getByMaintainer(maintainer: User): Promise<Mod[]> {
		const documents = await _Model
			.find({ maintainers: maintainer.userId })
			.exec();
		return Promise.all(documents.map((doc) => this.fromDocument(doc)));
	}

	async save(mod: Mod): Promise<void> {
		const doc = this.toDocument(mod);
		await _Model
			.findOneAndUpdate(
				{ id: mod.id },
				{
					name: doc.name,
					category: doc.category,
					description: doc.description,
					content: doc.content,
					tags: doc.tags,
					dependencies: doc.dependencies,
					screenshots: doc.screenshots,
					thumbnail: doc.thumbnail,
					visibility: doc.visibility,
					maintainers: doc.maintainers,
				},
				{
					new: true,
					upsert: true,
				},
			)
			.exec();
	}

	async delete(id: string): Promise<void> {
		await _Model.findByIdAndDelete(id).exec();
	}

	private async fromDocument(document: _Document): Promise<Mod> {
		return new Mod({
			id: document.id,
			name: document.name,
			category: document.category,
			description: document.description,
			content: document.content,
			tags: document.tags,
			dependencies: document.dependencies,
			screenshots: document.screenshots,
			thumbnail: document.thumbnail,
			visibility: document.visibility,
			maintainers: await Promise.all(
				document.maintainers.map(async (userId) =>
					this.userRepository.getByIdOrThrow(userId),
				),
			),
		});
	}

	protected toDocument(mod: Mod): _Document {
		return new _Model({
			id: mod.id,
			name: mod.name,
			category: mod.category,
			description: mod.description,
			content: mod.content,
			tags: mod.tags,
			dependencies: mod.dependencies,
			screenshots: mod.screenshots,
			thumbnail: mod.thumbnail,
			visibility: mod.visibility,
			maintainers: mod.maintainers.map((maintainer) => maintainer.userId),
		});
	}
}
