import {
	AppShell,
	Container,
	Group,
	Pagination,
	Select,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useEffect, useMemo, useState } from "react";
import { useGetMods } from "../_autogen/api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard.tsx";
import { ModFilterForm } from "../components/ModFilterForm.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useModFilters } from "../hooks/useModFilters.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AppIcons } from "../icons.ts";
import { modFilterService } from "../services/modFilterService.ts";

export function ModsPage() {
	const { t } = useAppTranslation();
	const breakpoint = useBreakpoint();
	const colorScheme = useComputedColorScheme();
	const [size, setSize] = useState<number>(10);
	const [page, setPage] = useState<number>(1);

	const { filters, initialValues, updateFilters } = useModFilters();

	const mods = useGetMods({
		page,
		size,
		...filters,
	});

	const categoriesData = mods.data?.data.filter.categories
		? modFilterService.transformCategories(mods.data.data.filter.categories, t)
		: [];

	const usersData = mods.data?.data.filter.maintainers
		? modFilterService.transformMaintainers(mods.data.data.filter.maintainers)
		: [];

	const tagsData = mods.data?.data.filter.tags
		? modFilterService.transformTags(mods.data.data.filter.tags)
		: [];

	const total = useMemo(
		() =>
			mods.data?.status === StatusCodes.OK
				? mods.data?.data.page.totalPages
				: 1,
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
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("BROWSE_MODS")}
						</Text>

						<ModFilterForm
							initialValues={initialValues}
							onSubmit={updateFilters}
							categories={categoriesData}
							users={usersData}
							tags={tagsData}
						/>

						{mods.data?.status === StatusCodes.OK &&
							mods.data.data.data.length === 0 && (
								<EmptyState
									withoutBorder
									title={t("NO_MODS_FOUND_TITLE")}
									description={t("NO_MODS_FOUND_SUBTITLE_DESC")}
									icon={AppIcons.Featured}
								/>
							)}

						{mods.data?.status === StatusCodes.OK &&
							mods.data.data.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={mod.averageRating}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={mod.subscribersCount}
									variant={breakpoint.isXs ? "grid" : "list"}
								/>
							))}

						{mods.data?.status === StatusCodes.OK && (
							<Group justify={"space-between"} align={"center"}>
								<Select
									w={75}
									data={["5", "10", "20", "50", "100"]}
									value={size.toString()}
									onChange={(v) => v && setSize(+v)}
								/>
								<Text size={"xs"} c={"dimmed"}>
									{t("DISPLAYING_RANGE", {
										start:
											(mods.data.data.page.number - 1) *
												mods.data.data.page.size +
											1,
										end:
											(mods.data.data.page.number - 1) *
												mods.data.data.page.size +
											mods.data.data.data.length,
										total: mods.data.data.page.totalElements,
									})}
								</Text>
								<Pagination total={total} onChange={setPage} value={page} />
							</Group>
						)}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}
