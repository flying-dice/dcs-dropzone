import { Alert, Badge, Button, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { FaLink } from "react-icons/fa6";
import { useGetMods } from "../_autogen/api.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { ModCard } from "./ModCard/index.tsx";

export type AppDependenciesInputProps = {
	value: string[];
	onChange: (value: string[]) => void;
};
export function AppDependenciesInput(props: AppDependenciesInputProps) {
	const [values, setValues] = useState<Set<string>>(new Set(props.value));
	const mods = useGetMods({ page: 1, size: 100 });
	const [searchModalOpen, setSearchModalOpen] = useDisclosure(false);
	const { t } = useAppTranslation();

	const handleBadgeClick = (id: string) => () => {
		const newValues = new Set(values);
		newValues.delete(id);
		setValues(newValues);
		props.onChange(Array.from(newValues));
	};

	return (
		<Stack gap={"xs"}>
			<Button variant={"default"} onClick={setSearchModalOpen.open} leftSection={<FaLink />}>
				{t("ADD_DEPENDENCY")}
			</Button>

			<Stack gap={"xs"}>
				{props.value?.map((id) => {
					const mod = mods.data?.data.data.find((m) => m.id === id);

					return (
						<>
							{mod ? (
								<ModCard
									key={id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={3}
									title={mod.name}
									summary={mod.description}
									downloads={3}
									variant={"list"}
									onClick={handleBadgeClick(id)}
								/>
							) : (
								<Alert key={id} variant={"warning"} onClick={handleBadgeClick(id)}>
									Unknown Mod ID: <Badge>{id}</Badge>
								</Alert>
							)}
						</>
					);
				})}
			</Stack>

			<Modal opened={searchModalOpen} onClose={setSearchModalOpen.close} size={"xl"}>
				<Stack>
					<TextInput label={"Search"} defaultValue={"one"} />
					{mods.data?.data.data.map((it) => (
						<Stack
							style={{ cursor: "pointer" }}
							key={it.id}
							onClick={() => {
								if (!values.has(it.name)) {
									const newValues = new Set(values);
									newValues.add(it.id);
									setValues(newValues);
									props.onChange(Array.from(newValues));
								}
							}}
						>
							<ModCard
								imageUrl={it.thumbnail}
								category={it.category}
								averageRating={3}
								title={it.name}
								summary={it.description}
								downloads={3}
								variant={"list"}
							/>
						</Stack>
					))}
				</Stack>
			</Modal>
		</Stack>
	);
}
