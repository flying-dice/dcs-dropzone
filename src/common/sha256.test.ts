import { expect, it } from "bun:test";
import { sha256 } from "./sha256"; // adjust path as needed

it("computes sha256 hash correctly for a string", () => {
	const result = sha256("hello");
	expect(result).toBe(
		"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
	);
});

it("computes sha256 hash correctly for a Buffer", () => {
	const result = sha256(Buffer.from("hello"));
	expect(result).toBe(
		"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
	);
});
