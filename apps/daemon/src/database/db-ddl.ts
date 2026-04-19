// @ts-expect-error
import _0000_init_sql from "./ddl/0000_init.sql" with { type: "text" };
// @ts-expect-error
import _0002_init_sql from "./ddl/0002_init.sql" with { type: "text" };

export const ddlExports: Record<string, string> = { _0000_init_sql, _0002_init_sql };
