import { Container, Stack } from "@mantine/core";
import { DzMain } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { useEffect, useMemo, useState } from "react";
import { useGetMods } from "../../_autogen/api.ts";
import { useModFilters } from "../../hooks/useModFilters.ts";
import { _ModsFilters } from "./_ModsFilters.tsx";
import { _ModsList } from "./_ModsList.tsx";
import { _PaginationControls } from "./_PaginationControls.tsx";

export function _ModsPage() {
	const [size, setSize] = useState<number>(10);
	const [page, setPage] = useState<number>(1);

	const { filters, initialValues, updateFilters } = useModFilters();

	const mods = useGetMods({
		page,
		size,
		...filters,
	});

	const total = useMemo(
		() => (mods.data?.status === StatusCodes.OK ? mods.data?.data.page.totalPages : 1),
		[mods.data],
	);

	useEffect(() => {
		if (mods.data?.status === StatusCodes.OK) {
			if (page > mods.data?.data.page.totalPages) {
				setPage(mods.data?.data.page.totalPages);
			}
		}
	}, [mods.data?.data, mods.data?.status, page]);

	return (
		<DzMain>
			<Container>
				<Stack py={"md"}>
					<_ModsFilters
						initialValues={initialValues}
						onSubmit={updateFilters}
						page={page}
						size={size}
						filters={filters}
					/>
					<_ModsList page={page} size={size} filters={filters} />
					<_PaginationControls
						page={page}
						size={size}
						total={total}
						filters={filters}
						onPageChange={setPage}
						onSizeChange={(v) => v && setSize(+v)}
					/>
				</Stack>
			</Container>
		</DzMain>
	);
}
