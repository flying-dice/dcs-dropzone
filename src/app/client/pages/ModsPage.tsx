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
import { useMemo, useState } from "react";
import { useGetMods } from "../_autogen/api.ts";
import { ModCard } from "../components/ModCard.tsx";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";

export function ModsPage() {
	const { t } = useAppTranslation();
	const colorScheme = useComputedColorScheme();
	const [size, setSize] = useState<number>(10);
	const [page, setPage] = useState<number>(1);

	const mods = useGetMods({ page, size });

	const total = useMemo(
		() =>
			mods.data?.status === StatusCodes.OK
				? mods.data?.data.page.totalPages
				: 1,
		[mods.data],
	);

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"md"}>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("BROWSE_MODS")}
						</Text>

						{mods.data?.status === StatusCodes.OK &&
							mods.data.data.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={4.8}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={1250}
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
