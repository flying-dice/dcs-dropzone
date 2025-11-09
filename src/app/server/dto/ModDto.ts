import { z } from "zod";
import { ModCategory, ModVisibility } from "../../../common/data.ts";
import type { Mod } from "../domain/Mod.ts";

export const ModDtoSchema = z.object({
	id: z.string(),
	name: z.string(),
	category: z.enum(ModCategory),
	description: z.string(),
	content: z.string(),
	tags: z.array(z.string()),
	dependencies: z.array(z.string()),
	screenshots: z.array(z.string()),
	thumbnail: z.string(),
	visibility: z.enum(ModVisibility),
	maintainers: z
		.array(z.string())
		.min(1, "A mod must have at least one maintainer."),
});

export type ModDto = z.infer<typeof ModDtoSchema>;

export function serializeMod(mod: Mod): ModDto {
	return ModDtoSchema.parse({
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

export function serializeMods(mods: Mod[]): ModDto[] {
	return mods.map(serializeMod);
}
