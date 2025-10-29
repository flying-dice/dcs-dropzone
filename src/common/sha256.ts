import { type BinaryLike, createHash } from "node:crypto";

export function sha256(input: BinaryLike): string {
	return createHash("sha256").update(input).digest("hex");
}
