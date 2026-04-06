import { z } from "zod";

export default () => z.preprocess((v) => (typeof v === "string" ? v === "true" || v === "1" : v), z.coerce.boolean());
