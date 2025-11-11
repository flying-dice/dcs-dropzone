import type { ModSummary } from "../domain/ModSummary.ts";
import type { Repository } from "./Repository.ts";

/**
 * Interface representing a repository for managing `ModSummary` entities.
 */
export interface ModSummaryRepository extends Repository<ModSummary> {}
