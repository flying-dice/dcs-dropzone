import { BehaviorSubject } from "rxjs";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";

export type AllDaemonReleases = ModAndReleaseData[];

const $ = new BehaviorSubject<AllDaemonReleases>([]);

export default {
	$,
};
