import { z } from "zod";

function fromCsv(csv: string): string[] | undefined {
	return csv
		.split(",")
		.map((item) => item.trim())
		.filter(
			(it) =>
				it !== "" && it !== null && it !== undefined && it.toLowerCase() !== "null" && it.toLowerCase() !== "undefined",
		);
}

export default () => z.string().transform(fromCsv);
