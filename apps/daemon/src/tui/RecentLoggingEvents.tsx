import type { RecentLoggingEvent } from "../log4js.ts";
import { RecentLoggingEventsItem } from "./RecentLoggingEventsItem.tsx";

export type RecentLoggingEventsProps = {
	events: RecentLoggingEvent[];
};
export function RecentLoggingEvents(props: RecentLoggingEventsProps) {
	return (
		<box height={20} borderStyle={"single"} title={"Logs (C to clear)"}>
			<scrollbox overflow={"scroll"} scrollX scrollY>
				{props.events.map((event) => (
					<RecentLoggingEventsItem key={event.id} event={event} />
				))}
			</scrollbox>
		</box>
	);
}
