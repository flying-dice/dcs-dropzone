import {
	AppShell,
	Container,
	Group,
	noop,
	Pagination,
	Select,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type ModDataCategory, useGetMods } from "../_autogen/api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard.tsx";
import { ModFilterForm } from "../components/ModFilterForm.tsx";
import type { I18nKeys } from "../i18n/I18nKeys.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AppIcons } from "../icons.ts";

export function ModsPage() {
	const { t } = useAppTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const colorScheme = useComputedColorScheme();
	const [size, setSize] = useState<number>(10);
	const [page, setPage] = useState<number>(1);

	const category =
		(searchParams.get("category") as ModDataCategory) || undefined;

	const maintainers = searchParams.get("authors") || undefined;

	const tags = searchParams.get("tags") || undefined;

	const term = searchParams.get("term") || undefined;

	const mods = useGetMods({
		page,
		size,
		category,
		maintainers,
		tags,
		term,
	});

	const categoriesData =
		mods.data?.data.filter.categories.map((category) => ({
			value: category,
			label: t(category as I18nKeys),
		})) || [];

	const usersData =
		mods.data?.data.filter.maintainers.map((maintainer) => ({
			value: maintainer.id,
			label: maintainer.username,
		})) || [];

	const tagsData =
		mods.data?.data.filter.tags.map((tag) => ({
			value: tag,
			label: tag,
		})) || [];

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
							initialValues={{
								category,
								authors: maintainers?.split(","),
								tags: tags?.split(","),
								term: term,
							}}
							onSubmit={(values) => {
								if (values.category && values.category.length > 0) {
									searchParams.set("category", values.category);
								} else {
									searchParams.delete("category");
								}

								if (values.tags && values.tags.length > 0) {
									searchParams.set("tags", values.tags.join(","));
								} else {
									searchParams.delete("tags");
								}

								if (values.authors && values.authors.length > 0) {
									searchParams.set("authors", values.authors.join(","));
								} else {
									searchParams.delete("authors");
								}

								if (values.term && values.term.length > 0) {
									searchParams.set("term", encodeURIComponent(values.term));
								} else {
									searchParams.delete("term");
								}

								setSearchParams(searchParams);
							}}
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
									onSubscribeToggle={noop}
									variant={"list"}
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
