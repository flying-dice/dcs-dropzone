import { GridModCard } from "./GridModCard.tsx";
import { ListModCard } from "./ListModCard.tsx";
import type { ModCardProps } from "./types.ts";

/**
 * ModCard component - renders a mod in either grid or list layout
 * This is a smart component that delegates to the appropriate presentational component
 */
export function ModCard(props: ModCardProps) {
	if (props.variant === "grid") {
		return <GridModCard {...props} />;
	}
	if (props.variant === "list") {
		return <ListModCard {...props} />;
	}
	// Default to list if variant is not recognized
	return <ListModCard {...props} />;
}

export type { ModCardProps };
