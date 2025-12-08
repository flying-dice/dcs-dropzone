import { z } from "zod";

const allowedTagPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default () => z.string().refine((it) => allowedTagPattern.test(it), { message: "INVALID_TAG_FORMAT_ERROR" });
