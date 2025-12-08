import { isEmpty, negate } from "lodash";
import { z } from "zod";

function fromCsv(csv: string): string[] | undefined {
	return csv
		.split(",")
		.map((item) => item.trim())
		.filter(negate(isEmpty));
}

export default () => z.string().transform(fromCsv);
