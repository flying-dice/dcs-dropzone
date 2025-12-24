import type { RecentLoggingEvent } from "../log4js.ts";
import { RecentLoggingEventsItem } from "./RecentLoggingEventsItem.tsx";

export type RecentLoggingEventsProps = {
	events: RecentLoggingEvent[];
};
export function RecentLoggingEvents(props: RecentLoggingEventsProps) {
	return (
		<box height={15} border={["top"]} title={"Logs"}>
			<scrollbox overflow={"scroll"} scrollX scrollY>
				{props.events.map((event) => (
					<RecentLoggingEventsItem key={event.id} event={event} />
				))}
			</scrollbox>
		</box>
	);
}
