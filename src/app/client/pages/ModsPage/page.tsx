import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { HttpStatusCode } from "axios";
import { StatusCodes } from "http-status-codes";
import { useEffect, useMemo, useState } from "react";
import { useGetMods } from "../../_autogen/api.ts";
import { useModFilters } from "../../hooks/useModFilters.ts";
import { modFilterService } from "../../services/modFilterService.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _ModsHeader } from "./_ModsHeader.tsx";
import { _ModsList } from "./_ModsList.tsx";
import { _PaginationControls } from "./_PaginationControls.tsx";

export function _ModsPage() {
	const { t } = useAppTranslation();
	const colorScheme = useComputedColorScheme();
	const [size, setSize] = useState<number>(10);
	const [page, setPage] = useState<number>(1);

	const { filters, initialValues, updateFilters } = useModFilters();

	const mods = useGetMods({
		page,
		size,
		...filters,
	});

	const categoriesData =
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.categories
			? modFilterService.transformCategories(mods.data.data.filter.categories, t)
			: [];

	const usersData =
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.maintainers
			? modFilterService.transformMaintainers(mods.data.data.filter.maintainers)
			: [];

	const tagsData =
		mods.data?.status === HttpStatusCode.Ok && mods.data?.data.filter.tags
			? modFilterService.transformTags(mods.data.data.filter.tags)
			: [];

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
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"md"}>
					<_ModsHeader
						initialValues={initialValues}
						onSubmit={updateFilters}
						categories={categoriesData}
						users={usersData}
						tags={tagsData}
					/>
					<_ModsList mods={mods.data} />
					<_PaginationControls
						mods={mods.data}
						page={page}
						size={size}
						total={total}
						onPageChange={setPage}
						onSizeChange={(v) => v && setSize(+v)}
					/>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}
