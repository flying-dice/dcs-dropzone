import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Button,
	Card,
	Center,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useListState } from "@mantine/hooks";
import { modals, openConfirmModal, openModal } from "@mantine/modals";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { FaCamera } from "react-icons/fa6";
import { z } from "zod";
import {
	type TranslateFunction,
	useAppTranslation,
} from "../../i18n/useAppTranslation.ts";
import type { UserModForm } from "./form.ts";

const formSchema = z.object({
	url: z.string().url("Invalid Image URL format").max(1000),
});

type FormValues = z.infer<typeof formSchema>;

function Form(props: {
	initialValues: FormValues;
	onSubmit: (values: FormValues) => void;
	onCancel: () => void;
	onRemove?: () => void;
}) {
	const form = useForm<FormValues>({
		initialValues: props.initialValues,
		validate: zod4Resolver(formSchema),
	});

	return (
		<form onSubmit={form.onSubmit((values) => props.onSubmit(values))}>
			<Stack gap={"lg"}>
				<Textarea
					label={"Image URL"}
					placeholder="Enter image URL"
					name={"url"}
					autosize
					{...form.getInputProps("url")}
				/>

				<Card withBorder>
					<Center>
						<Image radius={"md"} src={form.values.url} />
					</Center>
				</Card>
				<Group justify={"space-between"}>
					{props.onRemove ? (
						<Button color="red" onClick={props.onRemove}>
							Remove
						</Button>
					) : (
						<div />
					)}
					<Group justify={"flex-end"}>
						<Button onClick={props.onCancel} variant={"outline"}>
							Cancel
						</Button>
						<Button type="submit">Save</Button>
					</Group>
				</Group>
			</Stack>
		</form>
	);
}

function openImageModal(
	t: TranslateFunction,
	value: string,
	actions: {
		onChange: (value: string) => void;
		onRemove?: () => void;
		onCancel: () => void;
	},
) {
	openModal({
		title: "Change Screenshot",
		size: "xl",
		children: (
			<Form
				initialValues={{ url: value }}
				onSubmit={(values) => {
					actions.onChange(values.url);
				}}
				onCancel={actions.onCancel}
				onRemove={
					actions.onRemove
						? () => {
								openConfirmModal({
									title: t("CONFIRM_REMOVE_SCREENSHOT_TITLE"),
									children: t("CONFIRM_REMOVE_SCREENSHOT_DESC"),
									labels: { confirm: t("YES"), cancel: t("NO") },
									onConfirm: () => {
										actions.onRemove?.();
									},
								});
							}
						: undefined
				}
			/>
		),
	});
}

function SortableItem({
	item,
	onClick,
}: {
	item: { uuid: string; url: string };
	onClick: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: item.uuid,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		cursor: isDragging ? "grabbing" : "pointer",
	};

	return (
		<Image
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			h={150}
			radius={"md"}
			src={item.url}
			onClick={onClick}
		/>
	);
}

export function _Screenshots(props: { form: UserModForm }) {
	const { t } = useAppTranslation();
	const [state, handlers] = useListState(
		props.form.values.screenshots.map((url) => ({
			uuid: crypto.randomUUID(),
			url,
		})),
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}
		const oldIndex = state.findIndex((i) => i.uuid === active.id);
		const newIndex = state.findIndex((i) => i.uuid === over.id);
		const newState = arrayMove(state, oldIndex, newIndex);
		handlers.setState(newState);
		props.form.setFieldValue(
			"screenshots",
			newState.map((i) => i.url),
		);
	};

	useEffect(() => {
		handlers.setState(
			props.form.values.screenshots.map((url) => ({
				uuid: crypto.randomUUID(),
				url,
			})),
		);
	}, [props.form.values.screenshots, handlers.setState]);

	return (
		<Card withBorder>
			<Stack>
				<Text size={"lg"} fw={"bold"}>
					Screenshots
				</Text>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={state.map((i) => i.uuid)}
						strategy={rectSortingStrategy}
					>
						<SimpleGrid cols={2}>
							{state.map((item, index) => (
								<SortableItem
									key={item.uuid}
									item={item}
									onClick={() =>
										openImageModal(t, item.url, {
											onChange: (newUrl) => {
												props.form.replaceListItem(
													"screenshots",
													index,
													newUrl,
												);
												modals.closeAll();
											},
											onRemove: () => {
												props.form.removeListItem("screenshots", index);
												modals.closeAll();
											},
											onCancel: modals.closeAll,
										})
									}
								/>
							))}
						</SimpleGrid>
					</SortableContext>
				</DndContext>
				<Button
					fw={"normal"}
					variant={"default"}
					leftSection={<FaCamera />}
					onClick={() =>
						openImageModal(
							t,
							"https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
							{
								onChange: (newUrl) => {
									props.form.insertListItem("screenshots", newUrl);

									modals.closeAll();
								},
								onCancel: modals.closeAll,
							},
						)
					}
				>
					Add Screenshot
				</Button>
			</Stack>
		</Card>
	);
}
