import { _GridModCard } from "./_GridModCard.tsx";
import { _ListModCard } from "./_ListModCard.tsx";
import type { ModCardProps } from "./types.ts";

/**
 * ModCard component - renders a mod in either grid or list layout
 * This is a smart component that delegates to the appropriate presentational component
 */
export function ModCard(props: ModCardProps) {
	if (props.variant === "grid") {
		return <_GridModCard {...props} />;
	}
	if (props.variant === "list") {
		return <_ListModCard {...props} />;
	}
	// Default to list if variant is not recognized
	return <_ListModCard {...props} />;
}

export type { ModCardProps };
