import { Skeleton } from "@mantine/core";
import type { ComponentProps, ReactNode } from "react";
import type { AsyncState } from "react-use/lib/useAsyncFn";
import { ErrorState } from "./ErrorState.tsx";
import { AppIcons } from "./icons.ts";

export type AsyncStateWrapper<T> = {
	children: (data: T) => ReactNode;
	asyncState: AsyncState<T>;
	placeholder?: ReactNode;
	skeletonProps?: ComponentProps<typeof Skeleton>;
	onError?: (error: Error) => ReactNode;
};
export function AsyncStateWrapper<T>(props: AsyncStateWrapper<T>) {
	if (props.asyncState.loading || props.asyncState.value === undefined || props.asyncState.value === null) {
		return props.placeholder ?? <Skeleton {...props.skeletonProps} />;
	}

	if (props.asyncState.error) {
		if (props.onError) {
			return props.onError(props.asyncState.error);
		}
		return (
			<ErrorState
				title={props.asyncState.error.name}
				description={props.asyncState.error.message}
				icon={AppIcons.Error}
				withoutBorder
			/>
		);
	}

	return <>{props.children(props.asyncState.value)}</>;
}
